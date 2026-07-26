export interface FramePosition {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
}
export declare class CompositorService {
    compositePhoto(framePathOrUrl: string, userPhotoPath: string, framePosition: FramePosition, outputPath: string): Promise<string>;
    private createFallbackFrame;
}
