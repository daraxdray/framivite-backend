import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { CompositorService, FramePosition } from './compositor.service';

@Injectable()
export class RegistrationsService {
  constructor(
    private prisma: PrismaService,
    private compositorService: CompositorService,
    private cloudinaryService: CloudinaryService,
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

  async processPhotoUpload(
    id: string,
    photoFile: Express.Multer.File,
    photoOptions?: { position?: string; fit?: 'cover' | 'contain' },
  ) {
    if (!photoFile || (!photoFile.buffer && !photoFile.path)) {
      throw new BadRequestException('No photo file provided');
    }

    const registration = await this.findOne(id);
    const event = registration.event;

    const userPhotoBuffer = photoFile.buffer;

    // 1. Upload raw user selfie to Cloudinary (or local fallback)
    const photoUrl = await this.cloudinaryService.uploadBuffer(
      userPhotoBuffer,
      'framivite/selfies',
      `selfie-${id}.png`,
    );

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
        framePosition =
          typeof event.framePosition === 'string'
            ? JSON.parse(event.framePosition)
            : event.framePosition;
      } catch (err) {
        console.warn('Failed to parse framePosition JSON:', err);
      }
    }

    // 3. Trigger Compositing Pipeline (returns Buffer of composed PNG)
    const composedBuffer = await this.compositorService.compositePhoto(
      event.frameUrl,
      userPhotoBuffer,
      framePosition,
      photoOptions,
    );

    // 4. Upload composed PNG to Cloudinary (or local fallback)
    const composedImageUrl = await this.cloudinaryService.uploadBuffer(
      composedBuffer,
      'framivite/composed',
      `composed-${id}.png`,
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
