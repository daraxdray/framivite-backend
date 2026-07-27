import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { join } from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private isConfigured = false;

  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
    const cloudUrl = process.env.CLOUDINARY_URL?.trim().replace(/^['"]|['"]$/g, '');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.isConfigured = true;
      this.logger.log(`Cloudinary initialized with cloud_name: ${cloudName}`);
    } else if (cloudUrl) {
      try {
        const cleanUrl = cloudUrl.replace(/\/+$/, '');
        cloudinary.config({
          cloudinary_url: cleanUrl,
          secure: true,
        });
        const currentConfig = cloudinary.config();
        if (currentConfig.cloud_name && currentConfig.api_key) {
          this.isConfigured = true;
          this.logger.log(`Cloudinary initialized from CLOUDINARY_URL (cloud_name: ${currentConfig.cloud_name})`);
        } else {
          this.logger.error('CLOUDINARY_URL could not be parsed into valid cloud_name / api_key');
        }
      } catch (e: any) {
        this.logger.error('Failed to parse CLOUDINARY_URL:', e);
      }
    }

    if (!this.isConfigured) {
      this.logger.warn(
        'Cloudinary environment variables missing or invalid. Falling back to local disk storage.',
      );
    }
  }

  getStatus() {
    const config = cloudinary.config();
    return {
      isConfigured: this.isConfigured,
      hasCloudName: Boolean(config.cloud_name),
      cloudName: config.cloud_name || null,
      hasApiKey: Boolean(config.api_key),
      envVarsPresent: {
        CLOUDINARY_CLOUD_NAME: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
        CLOUDINARY_API_KEY: Boolean(process.env.CLOUDINARY_API_KEY),
        CLOUDINARY_API_SECRET: Boolean(process.env.CLOUDINARY_API_SECRET),
        CLOUDINARY_URL: Boolean(process.env.CLOUDINARY_URL),
      },
    };
  }

  async testUpload(buffer: Buffer, originalname?: string) {
    const config = cloudinary.config();
    if (!this.isConfigured || !config.cloud_name) {
      return {
        success: false,
        isConfigured: this.isConfigured,
        cloudName: config.cloud_name || null,
        error: 'Cloudinary is NOT configured on the server. Environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, or CLOUDINARY_URL) are missing in Render Environment settings.',
        status: this.getStatus(),
      };
    }

    try {
      const uniqueId = `test-${uuidv4().substring(0, 8)}`;
      const result: any = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'framivite/test',
            public_id: uniqueId,
            resource_type: 'auto',
          },
          (error, res) => {
            if (error) return reject(error);
            resolve(res);
          },
        );

        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);
        stream.pipe(uploadStream);
      });

      return {
        success: true,
        isConfigured: true,
        cloudName: config.cloud_name,
        uploadedUrl: result.secure_url,
        publicId: result.public_id,
        bytes: result.bytes,
        format: result.format,
        width: result.width,
        height: result.height,
        error: null,
      };
    } catch (err: any) {
      return {
        success: false,
        isConfigured: this.isConfigured,
        cloudName: config.cloud_name || null,
        error: err.message || 'Cloudinary upload failed',
        status: this.getStatus(),
      };
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    folder: string,
    customFilename?: string,
  ): Promise<string> {
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
      this.logger.warn('Empty or invalid buffer passed to uploadBuffer. Returning fallback path.');
      return '/uploads/frames/default-frame.png';
    }

    if (!this.isConfigured) {
      return this.fallbackToLocalDisk(buffer, folder, customFilename);
    }

    try {
      return await new Promise<string>((resolve, reject) => {
        const uniqueId = `${uuidv4().substring(0, 8)}`;
        const prefix = folder.split('/').pop() || 'media';
        const publicId = `${prefix}-${uniqueId}`;

        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: publicId,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) {
              this.logger.error(`Cloudinary stream error: ${error.message}`);
              return reject(error);
            }
            if (!result?.secure_url) {
              return reject(new Error('Cloudinary returned empty secure_url'));
            }
            this.logger.log(`Uploaded to Cloudinary successfully: ${result.secure_url}`);
            resolve(result.secure_url);
          },
        );

        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);
        stream.pipe(uploadStream);
      });
    } catch (err: any) {
      this.logger.error(`Cloudinary upload failed (${err.message}). Falling back to local disk storage.`);
      return this.fallbackToLocalDisk(buffer, folder, customFilename);
    }
  }

  private async fallbackToLocalDisk(
    buffer: Buffer,
    folder: string,
    customFilename?: string,
  ): Promise<string> {
    const filename = customFilename || `${uuidv4()}.png`;
    const targetDir = join(process.cwd(), 'uploads', folder.replace(/^framivite\/?/, ''));
    await fs.mkdir(targetDir, { recursive: true });
    const filePath = join(targetDir, filename);
    await fs.writeFile(filePath, buffer);

    const relativeFolder = folder.replace(/^framivite\/?/, '');
    const urlFolder = relativeFolder ? `${relativeFolder}/` : '';
    return `/uploads/${urlFolder}${filename}`;
  }
}
