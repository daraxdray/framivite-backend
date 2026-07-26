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
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { v4 as uuidv4 } from 'uuid';

const storage = diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'banner') {
      cb(null, join(process.cwd(), 'uploads', 'banners'));
    } else if (file.fieldname === 'frame') {
      cb(null, join(process.cwd(), 'uploads', 'frames'));
    } else {
      cb(null, join(process.cwd(), 'uploads'));
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${uuidv4()}${extname(file.originalname)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}`);
  },
});

@Controller('api/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

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
