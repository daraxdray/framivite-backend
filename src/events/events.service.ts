import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { CreateEventDto } from './dto/create-event.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async generateUniqueSlug(title: string): Promise<string> {
    let baseSlug = this.slugify(title) || 'event';
    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.event.findUnique({ where: { slug } })) {
      const shortId = uuidv4().substring(0, 4);
      slug = `${baseSlug}-${shortId}`;
      counter++;
      if (counter > 10) break;
    }
    return slug;
  }

  async create(
    createEventDto: CreateEventDto,
    bannerFile?: Express.Multer.File,
    frameFile?: Express.Multer.File,
    organizerId?: string,
  ) {
    const slug = await this.generateUniqueSlug(createEventDto.title);

    let bannerUrl = createEventDto.bannerUrl || null;
    if (bannerFile) {
      bannerUrl = await this.cloudinaryService.uploadBuffer(
        bannerFile.buffer,
        'framivite/banners',
        bannerFile.originalname,
      );
    }

    let frameUrl = createEventDto.frameUrl || '/uploads/frames/default-frame.png';
    if (frameFile) {
      frameUrl = await this.cloudinaryService.uploadBuffer(
        frameFile.buffer,
        'framivite/frames',
        frameFile.originalname,
      );
    }

    const defaultPosition = JSON.stringify({
      x: 100,
      y: 100,
      width: 400,
      height: 400,
      rotation: 0,
    });

    const framePosition = createEventDto.framePosition || defaultPosition;

    return this.prisma.event.create({
      data: {
        title: createEventDto.title,
        description: createEventDto.description || '',
        date: createEventDto.date ? new Date(createEventDto.date) : null,
        location: createEventDto.location || '',
        bannerUrl,
        frameUrl,
        framePosition,
        slug,
        organizerId: organizerId || createEventDto.organizerId || null,
      },
    });
  }

  async findAll(organizerId?: string) {
    const whereCondition = organizerId ? { organizerId } : {};
    return this.prisma.event.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    const event = await this.prisma.event.findUnique({
      where: { slug },
      include: {
        _count: { select: { registrations: true } },
      },
    });
    if (!event) {
      throw new NotFoundException(`Event with slug "${slug}" not found`);
    }
    return event;
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        registrations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!event) {
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }
    return event;
  }

  async update(
    id: string,
    updateData: Partial<CreateEventDto>,
    bannerFile?: Express.Multer.File,
    frameFile?: Express.Multer.File,
  ) {
    await this.findOne(id);

    const dataToUpdate: any = {};
    if (updateData.title !== undefined) dataToUpdate.title = updateData.title;
    if (updateData.description !== undefined) dataToUpdate.description = updateData.description;
    if (updateData.date !== undefined) dataToUpdate.date = updateData.date ? new Date(updateData.date) : null;
    if (updateData.location !== undefined) dataToUpdate.location = updateData.location;
    if (updateData.framePosition !== undefined) dataToUpdate.framePosition = updateData.framePosition;

    if (bannerFile) {
      dataToUpdate.bannerUrl = await this.cloudinaryService.uploadBuffer(
        bannerFile.buffer,
        'framivite/banners',
        bannerFile.originalname,
      );
    } else if (updateData.bannerUrl !== undefined) {
      dataToUpdate.bannerUrl = updateData.bannerUrl;
    }

    if (frameFile) {
      dataToUpdate.frameUrl = await this.cloudinaryService.uploadBuffer(
        frameFile.buffer,
        'framivite/frames',
        frameFile.originalname,
      );
    } else if (updateData.frameUrl !== undefined) {
      dataToUpdate.frameUrl = updateData.frameUrl;
    }

    return this.prisma.event.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.event.delete({ where: { id } });
  }
}
