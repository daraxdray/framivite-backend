import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { QuotesService, QuoteDto } from './quotes.service';

@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async submitQuote(@Body() body: QuoteDto) {
    return this.quotesService.handleQuoteRequest(body);
  }
}
