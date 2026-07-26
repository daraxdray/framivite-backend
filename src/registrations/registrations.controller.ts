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
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Response } from 'express';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { v4 as uuidv4 } from 'uuid';

const photoStorage = diskStorage({
  destination: join(process.cwd(), 'uploads', 'selfies'),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${uuidv4()}${extname(file.originalname)}`;
    cb(null, `selfie-${uniqueSuffix}`);
  },
});

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
      storage: photoStorage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cap as specified
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
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.registrationsService.processPhotoUpload(id, file);
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

    const relativePath = registration.composedImageUrl.replace('/uploads/', '');
    const fileFullPath = join(process.cwd(), 'uploads', relativePath);

    const filename = `framed-${registration.name.replace(/\s+/g, '-').toLowerCase()}-${id.substring(0, 6)}.png`;

    return res.download(fileFullPath, filename);
  }

  @Delete('registrations/:id')
  async remove(@Param('id') id: string) {
    return this.registrationsService.remove(id);
  }
}
