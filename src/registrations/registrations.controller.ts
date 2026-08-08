import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  Res,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { join } from 'path';
import type { Response } from 'express';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';

@Controller('api')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post('events/:slug/register')
  async register(
    @Param('slug') slug: string,
    @Body() createDto: CreateRegistrationDto,
  ) {
    return this.registrationsService.createRegistration(slug, createDto);
  }

  @Post('registrations/:id/photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB cap
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp|heic)$/i)) {
          return cb(
            new BadRequestException('Only JPG, PNG, WEBP image files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadPhoto(
    @Param('id') id: string,
    @Body() body: { photoPosition?: string; fitMode?: 'cover' | 'contain'; frameId?: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.registrationsService.processPhotoUpload(id, file, {
      position: body?.photoPosition,
      fit: body?.fitMode,
      frameId: body?.frameId,
    });
  }

  @Get('registrations/:id')
  async findOne(@Param('id') id: string) {
    return this.registrationsService.findOne(id);
  }

  @Get('registrations/:id/download')
  async downloadPhoto(@Param('id') id: string, @Res() res: Response) {
    const registration = await this.registrationsService.findOne(id);
    if (!registration.composedImageUrl) {
      throw new NotFoundException('Composed image not yet generated for this registration');
    }

    const filename = `framed-${registration.name.replace(/\s+/g, '-').toLowerCase()}-${id.substring(0, 6)}.png`;

    if (registration.composedImageUrl.startsWith('http://') || registration.composedImageUrl.startsWith('https://')) {
      try {
        const remoteRes = await fetch(registration.composedImageUrl);
        if (!remoteRes.ok) {
          return res.redirect(registration.composedImageUrl);
        }
        const arrayBuffer = await remoteRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(buffer);
      } catch (err) {
        console.error('Error fetching remote image for download:', err);
        return res.redirect(registration.composedImageUrl);
      }
    }

    const relativePath = registration.composedImageUrl.replace('/uploads/', '');
    const fileFullPath = join(process.cwd(), 'uploads', relativePath);

    return res.download(fileFullPath, filename);
  }

  @Delete('registrations/:id')
  async remove(@Param('id') id: string) {
    return this.registrationsService.remove(id);
  }
}
