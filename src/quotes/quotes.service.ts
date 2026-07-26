import { Injectable, Logger } from '@nestjs/common';

export class QuoteDto {
  name: string;
  email: string;
  company?: string;
  domain?: string;
  estimatedAttendees?: string;
  notes?: string;
}

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);
  private readonly targetEmail = 'daraxdray86@gmail.com';

  async handleQuoteRequest(dto: QuoteDto): Promise<{ success: boolean; message: string }> {
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

    // If Resend API Key is set in environment, send real email via Resend API
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
        } else {
          this.logger.log(`Successfully dispatched email to ${this.targetEmail} via Resend API`);
        }
      } catch (err) {
        this.logger.error(`Failed sending email via Resend: ${err.message}`);
      }
    } else {
      this.logger.log(`RESEND_API_KEY not set. Quote logged to server console successfully.`);
    }

    return {
      success: true,
      message: 'Your quote request has been submitted successfully and sent to our enterprise team.',
    };
  }
}
