import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { CreateEventDto } from './dto/create-event.dto';
export declare class EventsService {
    private prisma;
    private cloudinaryService;
    constructor(prisma: PrismaService, cloudinaryService: CloudinaryService);
    private slugify;
    generateUniqueSlug(title: string): Promise<string>;
    create(createEventDto: CreateEventDto, bannerFile?: Express.Multer.File, frameFile?: Express.Multer.File, organizerId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        date: Date | null;
        location: string | null;
        framePosition: string;
        bannerUrl: string | null;
        frameUrl: string;
        organizerId: string | null;
        slug: string;
    }>;
    findAll(organizerId?: string): Promise<({
        _count: {
            registrations: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        date: Date | null;
        location: string | null;
        framePosition: string;
        bannerUrl: string | null;
        frameUrl: string;
        organizerId: string | null;
        slug: string;
    })[]>;
    findBySlug(slug: string): Promise<{
        _count: {
            registrations: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        date: Date | null;
        location: string | null;
        framePosition: string;
        bannerUrl: string | null;
        frameUrl: string;
        organizerId: string | null;
        slug: string;
    }>;
    findOne(id: string): Promise<{
        registrations: {
            name: string;
            email: string;
            id: string;
            createdAt: Date;
            eventId: string;
            photoUrl: string | null;
            composedImageUrl: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        date: Date | null;
        location: string | null;
        framePosition: string;
        bannerUrl: string | null;
        frameUrl: string;
        organizerId: string | null;
        slug: string;
    }>;
    update(id: string, updateData: Partial<CreateEventDto>, bannerFile?: Express.Multer.File, frameFile?: Express.Multer.File): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        date: Date | null;
        location: string | null;
        framePosition: string;
        bannerUrl: string | null;
        frameUrl: string;
        organizerId: string | null;
        slug: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        date: Date | null;
        location: string | null;
        framePosition: string;
        bannerUrl: string | null;
        frameUrl: string;
        organizerId: string | null;
        slug: string;
    }>;
}
