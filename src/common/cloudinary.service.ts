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
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.isConfigured = true;
      this.logger.log(`Cloudinary initialized with cloud_name: ${cloudName}`);
    } else if (process.env.CLOUDINARY_URL) {
      cloudinary.config({ secure: true });
      this.isConfigured = true;
      this.logger.log('Cloudinary initialized with CLOUDINARY_URL');
    } else {
      this.logger.warn(
        'Cloudinary environment variables missing (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET). Falling back to local disk storage.',
      );
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    folder: string,
    customFilename?: string,
  ): Promise<string> {
    if (!this.isConfigured) {
      return this.fallbackToLocalDisk(buffer, folder, customFilename);
    }

    return new Promise((resolve, reject) => {
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
            this.logger.error(`Cloudinary upload failed: ${error.message}`);
            return reject(error);
          }
          if (!result?.secure_url) {
            return reject(new Error('Cloudinary upload returned empty URL'));
          }
          this.logger.log(`Uploaded to Cloudinary: ${result.secure_url}`);
          resolve(result.secure_url);
        },
      );

      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);
      stream.pipe(uploadStream);
    });
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
