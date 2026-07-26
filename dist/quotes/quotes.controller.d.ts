import { QuotesService, QuoteDto } from './quotes.service';
export declare class QuotesController {
    private readonly quotesService;
    constructor(quotesService: QuotesService);
    submitQuote(body: QuoteDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
