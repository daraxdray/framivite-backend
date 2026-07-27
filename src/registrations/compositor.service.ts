import { Injectable, InternalServerErrorException } from '@nestjs/common';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

export interface FramePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface PhotoAlignOptions {
  fit?: 'cover' | 'contain';
  position?: string; // 'top', 'center', 'bottom', 'left', 'right', etc.
}

@Injectable()
export class CompositorService {
  async compositePhoto(
    framePathOrUrl: string,
    userPhotoBufferOrPath: Buffer | string,
    framePosition: FramePosition,
    photoOptions?: PhotoAlignOptions,
  ): Promise<Buffer> {
    try {
      let frameBuffer: Buffer;

      if (framePathOrUrl.startsWith('http://') || framePathOrUrl.startsWith('https://')) {
        const res = await fetch(framePathOrUrl);
        if (!res.ok) {
          throw new Error(`Failed to fetch frame PNG from URL: ${res.statusText}`);
        }
        frameBuffer = Buffer.from(await res.arrayBuffer());
      } else {
        const cleanFramePath = framePathOrUrl.replace(/^(\/)?uploads(\/)?/, '');
        const frameFullPath = framePathOrUrl.startsWith(process.cwd())
          ? framePathOrUrl
          : path.join(process.cwd(), 'uploads', cleanFramePath);

        if (!fs.existsSync(frameFullPath)) {
          await this.createFallbackFrame(frameFullPath);
        }
        frameBuffer = await fs.promises.readFile(frameFullPath);
      }

      // 2. Read frame metadata to get full dimensions
      const frameMetadata = await sharp(frameBuffer).metadata();
      const frameWidth = frameMetadata.width || 1080;
      const frameHeight = frameMetadata.height || 1080;

      // 3. Process user photo: auto-orient EXIF & rotate if needed & resize to target (width, height)
      let photoPipeline = sharp(userPhotoBufferOrPath).rotate();

      if (framePosition.rotation && framePosition.rotation !== 0) {
        photoPipeline = photoPipeline.rotate(framePosition.rotation, {
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        });
      }

      const targetW = Math.max(1, Math.round(framePosition.width));
      const targetH = Math.max(1, Math.round(framePosition.height));

      const fitMode = photoOptions?.fit || 'cover';
      const positionSetting = photoOptions?.position || 'top';

      const resizedPhotoBuffer = await photoPipeline
        .resize(targetW, targetH, {
          fit: fitMode,
          position: positionSetting,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toBuffer();

      // 4. Create base blank canvas matching frame dimensions
      const canvasBuffer = await sharp({
        create: {
          width: frameWidth,
          height: frameHeight,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        },
      })
        .png()
        .toBuffer();

      // 5. Composite: photo placed at (x, y), frame PNG layered ON TOP at (0, 0)
      const posX = Math.round(framePosition.x);
      const posY = Math.round(framePosition.y);

      const finalImageBuffer = await sharp(canvasBuffer)
        .composite([
          {
            input: resizedPhotoBuffer,
            left: Math.max(0, Math.min(posX, frameWidth - 1)),
            top: Math.max(0, Math.min(posY, frameHeight - 1)),
          },
          {
            input: frameBuffer,
            left: 0,
            top: 0,
          },
        ])
        .png({ quality: 90 })
        .toBuffer();

      return finalImageBuffer;
    } catch (error) {
      console.error('Error compositing photo with sharp:', error);
      throw new InternalServerErrorException(
        `Photo compositing failed: ${error.message}`,
      );
    }
  }

  private async createFallbackFrame(targetPath: string) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    const width = 1080;
    const height = 1080;

    const frameBuffer = await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 30, g: 27, b: 75, alpha: 1 },
      },
    })
      .composite([
        {
          input: Buffer.from(`
            <svg width="${width}" height="${height}">
              <rect x="240" y="240" width="600" height="600" fill="black" />
            </svg>
          `),
          blend: 'dest-out',
        },
      ])
      .png()
      .toBuffer();

    await fs.promises.writeFile(targetPath, frameBuffer);
  }
}
