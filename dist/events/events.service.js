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
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const cloudinary_service_1 = require("../common/cloudinary.service");
const uuid_1 = require("uuid");
let EventsService = class EventsService {
    prisma;
    cloudinaryService;
    constructor(prisma, cloudinaryService) {
        this.prisma = prisma;
        this.cloudinaryService = cloudinaryService;
    }
    slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/[\s\W-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    async generateUniqueSlug(title) {
        let baseSlug = this.slugify(title) || 'event';
        let slug = baseSlug;
        let counter = 1;
        while (await this.prisma.event.findUnique({ where: { slug } })) {
            const shortId = (0, uuid_1.v4)().substring(0, 4);
            slug = `${baseSlug}-${shortId}`;
            counter++;
            if (counter > 10)
                break;
        }
        return slug;
    }
    async create(createEventDto, bannerFile, frameFile, organizerId) {
        const slug = await this.generateUniqueSlug(createEventDto.title);
        let bannerUrl = createEventDto.bannerUrl || null;
        if (bannerFile) {
            bannerUrl = await this.cloudinaryService.uploadBuffer(bannerFile.buffer, 'framivite/banners', bannerFile.originalname);
        }
        let frameUrl = createEventDto.frameUrl || '/uploads/frames/default-frame.png';
        if (frameFile) {
            frameUrl = await this.cloudinaryService.uploadBuffer(frameFile.buffer, 'framivite/frames', frameFile.originalname);
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
    async findAll(organizerId) {
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
    async findBySlug(slug) {
        const event = await this.prisma.event.findUnique({
            where: { slug },
            include: {
                _count: { select: { registrations: true } },
            },
        });
        if (!event) {
            throw new common_1.NotFoundException(`Event with slug "${slug}" not found`);
        }
        return event;
    }
    async findOne(id) {
        const event = await this.prisma.event.findUnique({
            where: { id },
            include: {
                registrations: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!event) {
            throw new common_1.NotFoundException(`Event with ID "${id}" not found`);
        }
        return event;
    }
    async update(id, updateData, bannerFile, frameFile) {
        await this.findOne(id);
        const dataToUpdate = {};
        if (updateData.title !== undefined)
            dataToUpdate.title = updateData.title;
        if (updateData.description !== undefined)
            dataToUpdate.description = updateData.description;
        if (updateData.date !== undefined)
            dataToUpdate.date = updateData.date ? new Date(updateData.date) : null;
        if (updateData.location !== undefined)
            dataToUpdate.location = updateData.location;
        if (updateData.framePosition !== undefined)
            dataToUpdate.framePosition = updateData.framePosition;
        if (bannerFile) {
            dataToUpdate.bannerUrl = await this.cloudinaryService.uploadBuffer(bannerFile.buffer, 'framivite/banners', bannerFile.originalname);
        }
        else if (updateData.bannerUrl !== undefined) {
            dataToUpdate.bannerUrl = updateData.bannerUrl;
        }
        if (frameFile) {
            dataToUpdate.frameUrl = await this.cloudinaryService.uploadBuffer(frameFile.buffer, 'framivite/frames', frameFile.originalname);
        }
        else if (updateData.frameUrl !== undefined) {
            dataToUpdate.frameUrl = updateData.frameUrl;
        }
        return this.prisma.event.update({
            where: { id },
            data: dataToUpdate,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.event.delete({ where: { id } });
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cloudinary_service_1.CloudinaryService])
], EventsService);
//# sourceMappingURL=events.service.js.map