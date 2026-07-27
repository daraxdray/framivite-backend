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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrationsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const registrations_service_1 = require("./registrations.service");
const create_registration_dto_1 = require("./dto/create-registration.dto");
let RegistrationsController = class RegistrationsController {
    registrationsService;
    constructor(registrationsService) {
        this.registrationsService = registrationsService;
    }
    async register(slug, createDto) {
        return this.registrationsService.createRegistration(slug, createDto);
    }
    async uploadPhoto(id, file) {
        return this.registrationsService.processPhotoUpload(id, file);
    }
    async findOne(id) {
        return this.registrationsService.findOne(id);
    }
    async downloadPhoto(id, res) {
        const registration = await this.registrationsService.findOne(id);
        if (!registration.composedImageUrl) {
            throw new common_1.NotFoundException('Composed image not yet generated for this registration');
        }
        if (registration.composedImageUrl.startsWith('http://') || registration.composedImageUrl.startsWith('https://')) {
            return res.redirect(registration.composedImageUrl);
        }
        const relativePath = registration.composedImageUrl.replace('/uploads/', '');
        const fileFullPath = (0, path_1.join)(process.cwd(), 'uploads', relativePath);
        const filename = `framed-${registration.name.replace(/\s+/g, '-').toLowerCase()}-${id.substring(0, 6)}.png`;
        return res.download(fileFullPath, filename);
    }
    async remove(id) {
        return this.registrationsService.remove(id);
    }
};
exports.RegistrationsController = RegistrationsController;
__decorate([
    (0, common_1.Post)('events/:slug/register'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_registration_dto_1.CreateRegistrationDto]),
    __metadata("design:returntype", Promise)
], RegistrationsController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('registrations/:id/photo'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/^image\/(jpeg|png|webp|heic)$/i)) {
                return cb(new common_1.BadRequestException('Only JPG, PNG, WEBP image files are allowed'), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RegistrationsController.prototype, "uploadPhoto", null);
__decorate([
    (0, common_1.Get)('registrations/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RegistrationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('registrations/:id/download'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RegistrationsController.prototype, "downloadPhoto", null);
__decorate([
    (0, common_1.Delete)('registrations/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RegistrationsController.prototype, "remove", null);
exports.RegistrationsController = RegistrationsController = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [registrations_service_1.RegistrationsService])
], RegistrationsController);
//# sourceMappingURL=registrations.controller.js.map