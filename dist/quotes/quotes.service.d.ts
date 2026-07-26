export declare class QuoteDto {
    name: string;
    email: string;
    company?: string;
    domain?: string;
    estimatedAttendees?: string;
    notes?: string;
}
export declare class QuotesService {
    private readonly logger;
    private readonly targetEmail;
    handleQuoteRequest(dto: QuoteDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
