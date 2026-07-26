"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var QuotesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotesService = exports.QuoteDto = void 0;
const common_1 = require("@nestjs/common");
class QuoteDto {
    name;
    email;
    company;
    domain;
    estimatedAttendees;
    notes;
}
exports.QuoteDto = QuoteDto;
let QuotesService = QuotesService_1 = class QuotesService {
    logger = new common_1.Logger(QuotesService_1.name);
    targetEmail = 'daraxdray86@gmail.com';
    async handleQuoteRequest(dto) {
        const subject = `[Framivite Quote Request] ${dto.name} ${dto.company ? `(${dto.company})` : ''}`;
        const emailBody = `
New Custom Domain / White-Label Quote Request received on Framivite!

--------------------------------------------------
Contact Name:        ${dto.name}
Work Email:          ${dto.email}
Company / Event:     ${dto.company || 'N/A'}
Desired Subdomain:   ${dto.domain || 'N/A'}
Expected Attendees:  ${dto.estimatedAttendees || '100 - 500'}
Additional Notes:    ${dto.notes || 'None'}
--------------------------------------------------
Submitted At:        ${new Date().toLocaleString()}
    `.trim();
        this.logger.log(`\n=== QUOTE REQUEST FOR ${this.targetEmail} ===\n${emailBody}\n============================`);
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey) {
            try {
                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: process.env.RESEND_FROM_EMAIL || 'Framivite <onboarding@resend.dev>',
                        to: [this.targetEmail],
                        subject: subject,
                        text: emailBody,
                    }),
                });
                if (!response.ok) {
                    const errData = await response.json();
                    this.logger.warn(`Resend API email error: ${JSON.stringify(errData)}`);
                }
                else {
                    this.logger.log(`Successfully dispatched email to ${this.targetEmail} via Resend API`);
                }
            }
            catch (err) {
                this.logger.error(`Failed sending email via Resend: ${err.message}`);
            }
        }
        else {
            this.logger.log(`RESEND_API_KEY not set. Quote logged to server console successfully.`);
        }
        return {
            success: true,
            message: 'Your quote request has been submitted successfully and sent to our enterprise team.',
        };
    }
};
exports.QuotesService = QuotesService;
exports.QuotesService = QuotesService = QuotesService_1 = __decorate([
    (0, common_1.Injectable)()
], QuotesService);
//# sourceMappingURL=quotes.service.js.map