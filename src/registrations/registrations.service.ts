import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { CompositorService, FramePosition } from './compositor.service';
import { join } from 'path';

@Injectable()
export class RegistrationsService {
  constructor(
    private prisma: PrismaService,
    private compositorService: CompositorService,
  ) {}

  async createRegistration(slug: string, createDto: CreateRegistrationDto) {
    const event = await this.prisma.event.findUnique({
      where: { slug },
    });
    if (!event) {
      throw new NotFoundException(`Event with slug "${slug}" not found`);
    }

    return this.prisma.registration.create({
      data: {
        eventId: event.id,
        name: createDto.name,
        email: createDto.email,
      },
    });
  }

  async findOne(id: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: { event: true },
    });
    if (!registration) {
      throw new NotFoundException(`Registration with ID "${id}" not found`);
    }
    return registration;
  }

  async processPhotoUpload(id: string, photoFile: Express.Multer.File) {
    if (!photoFile) {
      throw new BadRequestException('No photo file provided');
    }

    const registration = await this.findOne(id);
    const event = registration.event;

    // 1. Photo URL
    const photoUrl = `/uploads/selfies/${photoFile.filename}`;
    const userPhotoPath = photoFile.path;

    // 2. Parse framePosition JSON
    let framePosition: FramePosition = {
      x: 100,
      y: 100,
      width: 400,
      height: 400,
      rotation: 0,
    };

    if (event.framePosition) {
      try {
        framePosition = typeof event.framePosition === 'string'
          ? JSON.parse(event.framePosition)
          : event.framePosition;
      } catch (err) {
        console.warn('Failed to parse framePosition JSON:', err);
      }
    }

    // 3. Output path for composed image
    const composedFilename = `composed-${id}.png`;
    const composedFullPath = join(process.cwd(), 'uploads', 'composed', composedFilename);
    const composedImageUrl = `/uploads/composed/${composedFilename}`;

    // 4. Trigger Compositing Pipeline
    await this.compositorService.compositePhoto(
      event.frameUrl,
      userPhotoPath,
      framePosition,
      composedFullPath,
    );

    // 5. Update Registration record
    return this.prisma.registration.update({
      where: { id },
      data: {
        photoUrl,
        composedImageUrl,
      },
      include: { event: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.registration.delete({ where: { id } });
  }
}
