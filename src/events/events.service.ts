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

  private parseDateSafely(dateVal: any): Date | null {
    if (!dateVal || dateVal === 'null' || dateVal === 'undefined' || dateVal === '') return null;
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  }

  async create(
    createEventDto: CreateEventDto,
    bannerFile?: Express.Multer.File,
    frameFile?: Express.Multer.File,
    organizerId?: string,
  ) {
    const slug = await this.generateUniqueSlug(createEventDto.title);

    let bannerUrl = createEventDto.bannerUrl || null;
    if (bannerFile && bannerFile.buffer && bannerFile.buffer.length > 0) {
      try {
        bannerUrl = await this.cloudinaryService.uploadBuffer(
          bannerFile.buffer,
          'framivite/banners',
          bannerFile.originalname,
        );
      } catch (err) {
        console.error('Failed to upload banner:', err);
      }
    }

    let frameUrl = createEventDto.frameUrl || '/uploads/frames/default-frame.png';
    if (frameFile && frameFile.buffer && frameFile.buffer.length > 0) {
      try {
        frameUrl = await this.cloudinaryService.uploadBuffer(
          frameFile.buffer,
          'framivite/frames',
          frameFile.originalname,
        );
      } catch (err) {
        console.error('Failed to upload frame:', err);
      }
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
        date: this.parseDateSafely(createEventDto.date),
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
    if (updateData.title !== undefined && updateData.title.trim() !== '') {
      dataToUpdate.title = updateData.title;
    }
    if (updateData.description !== undefined) {
      dataToUpdate.description = updateData.description || '';
    }
    if (updateData.date !== undefined) {
      dataToUpdate.date = this.parseDateSafely(updateData.date);
    }
    if (updateData.location !== undefined) {
      dataToUpdate.location = updateData.location || '';
    }
    if (updateData.framePosition !== undefined && updateData.framePosition.trim() !== '') {
      dataToUpdate.framePosition = updateData.framePosition;
    }

    if (bannerFile && bannerFile.buffer && bannerFile.buffer.length > 0) {
      try {
        dataToUpdate.bannerUrl = await this.cloudinaryService.uploadBuffer(
          bannerFile.buffer,
          'framivite/banners',
          bannerFile.originalname,
        );
      } catch (err) {
        console.error('Failed to update banner:', err);
      }
    } else if (updateData.bannerUrl !== undefined) {
      dataToUpdate.bannerUrl = updateData.bannerUrl;
    }

    if (frameFile && frameFile.buffer && frameFile.buffer.length > 0) {
      try {
        dataToUpdate.frameUrl = await this.cloudinaryService.uploadBuffer(
          frameFile.buffer,
          'framivite/frames',
          frameFile.originalname,
        );
      } catch (err) {
        console.error('Failed to update frame:', err);
      }
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
