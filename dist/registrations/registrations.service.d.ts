import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { CompositorService } from './compositor.service';
export declare class RegistrationsService {
    private prisma;
    private compositorService;
    constructor(prisma: PrismaService, compositorService: CompositorService);
    createRegistration(slug: string, createDto: CreateRegistrationDto): Promise<{
        name: string;
        email: string;
        id: string;
        createdAt: Date;
        eventId: string;
        photoUrl: string | null;
        composedImageUrl: string | null;
    }>;
    findOne(id: string): Promise<{
        event: {
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
        };
    } & {
        name: string;
        email: string;
        id: string;
        createdAt: Date;
        eventId: string;
        photoUrl: string | null;
        composedImageUrl: string | null;
    }>;
    processPhotoUpload(id: string, photoFile: Express.Multer.File): Promise<{
        event: {
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
        };
    } & {
        name: string;
        email: string;
        id: string;
        createdAt: Date;
        eventId: string;
        photoUrl: string | null;
        composedImageUrl: string | null;
    }>;
    remove(id: string): Promise<{
        name: string;
        email: string;
        id: string;
        createdAt: Date;
        eventId: string;
        photoUrl: string | null;
        composedImageUrl: string | null;
    }>;
}
