import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { CloudinaryService } from '../common/cloudinary.service';

const storage = memoryStorage();

@Controller('api/events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get('cloudinary-status')
  async getCloudinaryStatus() {
    return this.cloudinaryService.getStatus();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'banner', maxCount: 1 },
        { name: 'frame', maxCount: 1 },
      ],
      {
        storage,
        limits: { fileSize: 10 * 1024 * 1024 },
      },
    ),
  )
  async create(
    @Req() req: any,
    @Body() createEventDto: CreateEventDto,
    @UploadedFiles()
    files: { banner?: Express.Multer.File[]; frame?: Express.Multer.File[] },
  ) {
    const bannerFile = files?.banner?.[0];
    const frameFile = files?.frame?.[0];
    const organizerId = req.user?.id;

    return this.eventsService.create(createEventDto, bannerFile, frameFile, organizerId);
  }

  @Get()
  async findAll() {
    return this.eventsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('organizer/my-events')
  async findMyEvents(@Req() req: any) {
    return this.eventsService.findAll(req.user?.id);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.eventsService.findBySlug(slug);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'banner', maxCount: 1 },
        { name: 'frame', maxCount: 1 },
      ],
      { storage },
    ),
  )
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: Partial<CreateEventDto>,
    @UploadedFiles()
    files: { banner?: Express.Multer.File[]; frame?: Express.Multer.File[] },
  ) {
    const bannerFile = files?.banner?.[0];
    const frameFile = files?.frame?.[0];
    return this.eventsService.update(id, updateEventDto, bannerFile, frameFile);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }
}
