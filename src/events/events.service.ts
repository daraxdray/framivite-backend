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

  private defaultPosition = JSON.stringify({
    x: 100,
    y: 100,
    width: 400,
    height: 400,
    rotation: 0,
  });

  private formatEvent<T extends { id: string; frameUrl?: string | null; framePosition?: string | null; frames?: any[] }>(event: T): T {
    if (!event) return event;
    const frames = event.frames && event.frames.length > 0
      ? event.frames
      : [
          {
            id: `legacy-${event.id}`,
            eventId: event.id,
            name: 'Frame 1',
            frameUrl: event.frameUrl || '/uploads/frames/default-frame.png',
            framePosition: event.framePosition || this.defaultPosition,
          },
        ];
    return {
      ...event,
      frameUrl: event.frameUrl || frames[0].frameUrl,
      framePosition: event.framePosition || frames[0].framePosition,
      frames,
    };
  }

  async create(
    createEventDto: CreateEventDto,
    bannerFile?: Express.Multer.File,
    frameFiles: Express.Multer.File[] = [],
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

    let rawFrames: Array<{ id?: string; name?: string; framePosition?: string; frameUrl?: string; fileIndex?: number }> = [];
    if (createEventDto.framesData) {
      try {
        rawFrames = JSON.parse(createEventDto.framesData);
      } catch (e) {
        console.warn('Failed to parse framesData JSON:', e);
      }
    }

    if (rawFrames.length === 0) {
      rawFrames = [
        {
          name: 'Frame 1',
          framePosition: createEventDto.framePosition || this.defaultPosition,
          frameUrl: createEventDto.frameUrl,
          fileIndex: 0,
        },
      ];
    }

    const processedFrames: Array<{ name: string; frameUrl: string; framePosition: string }> = [];

    for (let i = 0; i < rawFrames.length; i++) {
      const item = rawFrames[i];
      const file = item.fileIndex !== undefined ? frameFiles[item.fileIndex] : frameFiles[i];

      let frameUrl = item.frameUrl || createEventDto.frameUrl || '/uploads/frames/default-frame.png';
      if (file && file.buffer && file.buffer.length > 0) {
        try {
          frameUrl = await this.cloudinaryService.uploadBuffer(
            file.buffer,
            'framivite/frames',
            file.originalname,
          );
        } catch (err) {
          console.error(`Failed to upload frame file index ${item.fileIndex}:`, err);
        }
      }

      processedFrames.push({
        name: item.name && item.name.trim() ? item.name : `Frame ${i + 1}`,
        frameUrl,
        framePosition: item.framePosition || createEventDto.framePosition || this.defaultPosition,
      });
    }

    const primaryFrame = processedFrames[0] || {
      frameUrl: '/uploads/frames/default-frame.png',
      framePosition: this.defaultPosition,
    };

    const createdEvent = await this.prisma.event.create({
      data: {
        title: createEventDto.title,
        description: createEventDto.description || '',
        date: this.parseDateSafely(createEventDto.date),
        location: createEventDto.location || '',
        bannerUrl,
        frameUrl: primaryFrame.frameUrl,
        framePosition: primaryFrame.framePosition,
        slug,
        organizerId: organizerId || createEventDto.organizerId || null,
        frames: {
          create: processedFrames,
        },
      },
      include: {
        frames: { orderBy: { createdAt: 'asc' } },
      },
    });

    return this.formatEvent(createdEvent);
  }

  async findAll(organizerId?: string) {
    const whereCondition = organizerId ? { organizerId } : {};
    const events = await this.prisma.event.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      include: {
        frames: { orderBy: { createdAt: 'asc' } },
        _count: {
          select: { registrations: true },
        },
      },
    });
    return events.map((e) => this.formatEvent(e));
  }

  async findBySlug(slug: string) {
    const event = await this.prisma.event.findUnique({
      where: { slug },
      include: {
        frames: { orderBy: { createdAt: 'asc' } },
        _count: { select: { registrations: true } },
      },
    });
    if (!event) {
      throw new NotFoundException(`Event with slug "${slug}" not found`);
    }
    return this.formatEvent(event);
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        frames: { orderBy: { createdAt: 'asc' } },
        registrations: {
          orderBy: { createdAt: 'desc' },
          include: { frame: true },
        },
      },
    });
    if (!event) {
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }
    return this.formatEvent(event);
  }

  async update(
    id: string,
    updateData: Partial<CreateEventDto>,
    bannerFile?: Express.Multer.File,
    frameFiles: Express.Multer.File[] = [],
  ) {
    const existing = await this.findOne(id);

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

    if (updateData.framesData) {
      let rawFrames: Array<{ id?: string; name?: string; framePosition?: string; frameUrl?: string; fileIndex?: number }> = [];
      try {
        rawFrames = JSON.parse(updateData.framesData);
      } catch (e) {
        console.warn('Failed to parse update framesData JSON:', e);
      }

      if (rawFrames.length > 0) {
        const keptFrameIds = rawFrames
          .map((f) => f.id)
          .filter((id) => id && !id.startsWith('legacy-')) as string[];

        // Delete frames removed by user
        await this.prisma.eventFrame.deleteMany({
          where: {
            eventId: id,
            id: { notIn: keptFrameIds },
          },
        });

        const updatedFramesList: Array<{ id?: string; name: string; frameUrl: string; framePosition: string }> = [];

        for (let i = 0; i < rawFrames.length; i++) {
          const item = rawFrames[i];
          const file = item.fileIndex !== undefined ? frameFiles[item.fileIndex] : undefined;

          let frameUrl = item.frameUrl || existing.frameUrl || '/uploads/frames/default-frame.png';
          if (file && file.buffer && file.buffer.length > 0) {
            try {
              frameUrl = await this.cloudinaryService.uploadBuffer(
                file.buffer,
                'framivite/frames',
                file.originalname,
              );
            } catch (err) {
              console.error(`Failed to upload frame file index ${item.fileIndex}:`, err);
            }
          }

          const frameName = item.name && item.name.trim() ? item.name : `Frame ${i + 1}`;
          const framePosition = item.framePosition || existing.framePosition || this.defaultPosition;

          if (item.id && !item.id.startsWith('legacy-')) {
            await this.prisma.eventFrame.update({
              where: { id: item.id },
              data: {
                name: frameName,
                frameUrl,
                framePosition,
              },
            });
            updatedFramesList.push({ id: item.id, name: frameName, frameUrl, framePosition });
          } else {
            const created = await this.prisma.eventFrame.create({
              data: {
                eventId: id,
                name: frameName,
                frameUrl,
                framePosition,
              },
            });
            updatedFramesList.push({ id: created.id, name: created.name || frameName, frameUrl: created.frameUrl, framePosition: created.framePosition });
          }
        }

        if (updatedFramesList.length > 0) {
          dataToUpdate.frameUrl = updatedFramesList[0].frameUrl;
          dataToUpdate.framePosition = updatedFramesList[0].framePosition;
        }
      }
    } else if (frameFiles.length > 0 || updateData.frameUrl || updateData.framePosition) {
      // Fallback for single frame legacy updates
      let frameUrl = existing.frameUrl || '/uploads/frames/default-frame.png';
      const file = frameFiles[0];
      if (file && file.buffer && file.buffer.length > 0) {
        try {
          frameUrl = await this.cloudinaryService.uploadBuffer(
            file.buffer,
            'framivite/frames',
            file.originalname,
          );
        } catch (err) {
          console.error('Failed to update frame:', err);
        }
      } else if (updateData.frameUrl !== undefined) {
        frameUrl = updateData.frameUrl;
      }

      dataToUpdate.frameUrl = frameUrl;
      if (updateData.framePosition) {
        dataToUpdate.framePosition = updateData.framePosition;
      }

      const existingFrames = await this.prisma.eventFrame.findMany({ where: { eventId: id } });
      if (existingFrames.length > 0) {
        await this.prisma.eventFrame.update({
          where: { id: existingFrames[0].id },
          data: {
            frameUrl,
            framePosition: dataToUpdate.framePosition || existingFrames[0].framePosition,
          },
        });
      }
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: dataToUpdate,
      include: {
        frames: { orderBy: { createdAt: 'asc' } },
        registrations: {
          orderBy: { createdAt: 'desc' },
          include: { frame: true },
        },
      },
    });

    return this.formatEvent(updatedEvent);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.event.delete({ where: { id } });
  }
}
