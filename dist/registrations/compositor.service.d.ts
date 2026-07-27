export interface FramePosition {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
}
export declare class CompositorService {
    compositePhoto(framePathOrUrl: string, userPhotoBufferOrPath: Buffer | string, framePosition: FramePosition): Promise<Buffer>;
    private createFallbackFrame;
}
