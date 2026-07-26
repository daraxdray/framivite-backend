import type { Response } from 'express';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
export declare class RegistrationsController {
    private readonly registrationsService;
    constructor(registrationsService: RegistrationsService);
    register(slug: string, createDto: CreateRegistrationDto): Promise<{
        name: string;
        email: string;
        id: string;
        createdAt: Date;
        eventId: string;
        photoUrl: string | null;
        composedImageUrl: string | null;
    }>;
    uploadPhoto(id: string, file: Express.Multer.File): Promise<{
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
    downloadPhoto(id: string, res: Response): Promise<void>;
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
