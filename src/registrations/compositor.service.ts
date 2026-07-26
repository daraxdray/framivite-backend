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

@Injectable()
export class CompositorService {
  async compositePhoto(
    framePathOrUrl: string,
    userPhotoPath: string,
    framePosition: FramePosition,
    outputPath: string,
  ): Promise<string> {
    try {
      const cleanFramePath = framePathOrUrl.replace(/^(\/)?uploads(\/)?/, '');
      const frameFullPath = framePathOrUrl.startsWith(process.cwd())
        ? framePathOrUrl
        : path.join(process.cwd(), 'uploads', cleanFramePath);

      if (!fs.existsSync(frameFullPath)) {
        // Fallback: create a mock transparent frame PNG if frame missing
        await this.createFallbackFrame(frameFullPath);
      }

      // 2. Read frame metadata to get full dimensions
      const frameMetadata = await sharp(frameFullPath).metadata();
      const frameWidth = frameMetadata.width || 1080;
      const frameHeight = frameMetadata.height || 1080;

      // 3. Process user photo: auto-orient EXIF & rotate if needed & resize to target (width, height)
      let photoPipeline = sharp(userPhotoPath).rotate();

      if (framePosition.rotation && framePosition.rotation !== 0) {
        photoPipeline = photoPipeline.rotate(framePosition.rotation, {
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        });
      }

      const targetW = Math.max(1, Math.round(framePosition.width));
      const targetH = Math.max(1, Math.round(framePosition.height));

      const resizedPhotoBuffer = await photoPipeline
        .resize(targetW, targetH, {
          fit: 'cover',
          position: 'center',
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

      // 5. Read frame buffer
      const frameBuffer = await sharp(frameFullPath).toBuffer();

      // 6. Composite: photo placed at (x, y), frame PNG layered ON TOP at (0, 0)
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

      // 7. Write to output path
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      await fs.promises.writeFile(outputPath, finalImageBuffer);

      return outputPath;
    } catch (error) {
      console.error('Error compositing photo with sharp:', error);
      throw new InternalServerErrorException(
        `Photo compositing failed: ${error.message}`,
      );
    }
  }

  private async createFallbackFrame(targetPath: string) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    // Create simple PNG frame with transparent hole in middle
    const width = 1080;
    const height = 1080;

    const svgOverlay = `
      <svg width="${width}" height="${height}">
        <rect width="${width}" height="${height}" fill="#1e1b4b" />
        <rect x="240" y="240" width="600" height="600" fill="black" />
      </svg>
    `;

    // Make dark border with transparent window in center (240, 240, 600, 600)
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
