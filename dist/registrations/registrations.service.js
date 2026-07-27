"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const cloudinary_service_1 = require("../common/cloudinary.service");
const compositor_service_1 = require("./compositor.service");
let RegistrationsService = class RegistrationsService {
    prisma;
    compositorService;
    cloudinaryService;
    constructor(prisma, compositorService, cloudinaryService) {
        this.prisma = prisma;
        this.compositorService = compositorService;
        this.cloudinaryService = cloudinaryService;
    }
    async createRegistration(slug, createDto) {
        const event = await this.prisma.event.findUnique({
            where: { slug },
        });
        if (!event) {
            throw new common_1.NotFoundException(`Event with slug "${slug}" not found`);
        }
        return this.prisma.registration.create({
            data: {
                eventId: event.id,
                name: createDto.name,
                email: createDto.email,
            },
        });
    }
    async findOne(id) {
        const registration = await this.prisma.registration.findUnique({
            where: { id },
            include: { event: true },
        });
        if (!registration) {
            throw new common_1.NotFoundException(`Registration with ID "${id}" not found`);
        }
        return registration;
    }
    async processPhotoUpload(id, photoFile) {
        if (!photoFile || (!photoFile.buffer && !photoFile.path)) {
            throw new common_1.BadRequestException('No photo file provided');
        }
        const registration = await this.findOne(id);
        const event = registration.event;
        const userPhotoBuffer = photoFile.buffer;
        const photoUrl = await this.cloudinaryService.uploadBuffer(userPhotoBuffer, 'framivite/selfies', `selfie-${id}.png`);
        let framePosition = {
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
            }
            catch (err) {
                console.warn('Failed to parse framePosition JSON:', err);
            }
        }
        const composedBuffer = await this.compositorService.compositePhoto(event.frameUrl, userPhotoBuffer, framePosition);
        const composedImageUrl = await this.cloudinaryService.uploadBuffer(composedBuffer, 'framivite/composed', `composed-${id}.png`);
        return this.prisma.registration.update({
            where: { id },
            data: {
                photoUrl,
                composedImageUrl,
            },
            include: { event: true },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.registration.delete({ where: { id } });
    }
};
exports.RegistrationsService = RegistrationsService;
exports.RegistrationsService = RegistrationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        compositor_service_1.CompositorService,
        cloudinary_service_1.CloudinaryService])
], RegistrationsService);
//# sourceMappingURL=registrations.service.js.map