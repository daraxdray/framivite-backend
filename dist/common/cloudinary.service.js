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
var CloudinaryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryService = void 0;
const common_1 = require("@nestjs/common");
const cloudinary_1 = require("cloudinary");
const stream_1 = require("stream");
const path_1 = require("path");
const fs_1 = require("fs");
const uuid_1 = require("uuid");
let CloudinaryService = CloudinaryService_1 = class CloudinaryService {
    logger = new common_1.Logger(CloudinaryService_1.name);
    isConfigured = false;
    constructor() {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;
        if (cloudName && apiKey && apiSecret) {
            cloudinary_1.v2.config({
                cloud_name: cloudName,
                api_key: apiKey,
                api_secret: apiSecret,
                secure: true,
            });
            this.isConfigured = true;
            this.logger.log(`Cloudinary initialized with cloud_name: ${cloudName}`);
        }
        else if (process.env.CLOUDINARY_URL) {
            cloudinary_1.v2.config({ secure: true });
            this.isConfigured = true;
            this.logger.log('Cloudinary initialized with CLOUDINARY_URL');
        }
        else {
            this.logger.warn('Cloudinary environment variables missing (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET). Falling back to local disk storage.');
        }
    }
    async uploadBuffer(buffer, folder, customFilename) {
        if (!this.isConfigured) {
            return this.fallbackToLocalDisk(buffer, folder, customFilename);
        }
        return new Promise((resolve, reject) => {
            const publicId = customFilename ? customFilename.replace(/\.[^/.]+$/, '') : undefined;
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder,
                public_id: publicId,
                resource_type: 'auto',
            }, (error, result) => {
                if (error) {
                    this.logger.error(`Cloudinary upload failed: ${error.message}`);
                    return reject(error);
                }
                if (!result?.secure_url) {
                    return reject(new Error('Cloudinary upload returned empty URL'));
                }
                this.logger.log(`Uploaded to Cloudinary: ${result.secure_url}`);
                resolve(result.secure_url);
            });
            const stream = new stream_1.Readable();
            stream.push(buffer);
            stream.push(null);
            stream.pipe(uploadStream);
        });
    }
    async fallbackToLocalDisk(buffer, folder, customFilename) {
        const filename = customFilename || `${(0, uuid_1.v4)()}.png`;
        const targetDir = (0, path_1.join)(process.cwd(), 'uploads', folder.replace(/^framivite\/?/, ''));
        await fs_1.promises.mkdir(targetDir, { recursive: true });
        const filePath = (0, path_1.join)(targetDir, filename);
        await fs_1.promises.writeFile(filePath, buffer);
        const relativeFolder = folder.replace(/^framivite\/?/, '');
        const urlFolder = relativeFolder ? `${relativeFolder}/` : '';
        return `/uploads/${urlFolder}${filename}`;
    }
};
exports.CloudinaryService = CloudinaryService;
exports.CloudinaryService = CloudinaryService = CloudinaryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CloudinaryService);
//# sourceMappingURL=cloudinary.service.js.map