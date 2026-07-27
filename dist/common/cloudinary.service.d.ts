export declare class CloudinaryService {
    private readonly logger;
    private isConfigured;
    constructor();
    uploadBuffer(buffer: Buffer, folder: string, customFilename?: string): Promise<string>;
    private fallbackToLocalDisk;
}
