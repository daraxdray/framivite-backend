import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
export declare class EventsController {
    private readonly eventsService;
    constructor(eventsService: EventsService);
    create(req: any, createEventDto: CreateEventDto, files: {
        banner?: Express.Multer.File[];
        frame?: Express.Multer.File[];
    }): Promise<{
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
    findAll(): Promise<({
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
    findMyEvents(req: any): Promise<({
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
    update(id: string, updateEventDto: Partial<CreateEventDto>, files: {
        banner?: Express.Multer.File[];
        frame?: Express.Multer.File[];
    }): Promise<{
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
