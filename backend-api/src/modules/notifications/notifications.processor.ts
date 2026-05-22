import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailService } from '@/modules/email/email.service';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { type, userId, title, message } = job.data;

    switch (type) {
      case 'OUTBID':
        // Handle specific logic if needed
        break;
      case 'AUCTION_WON':
        // Trigger email
        break;
      // Add more cases
    }

    // Example: All notifications also send an email for now (simplification)
    console.log(`Processing notification for user ${userId}: ${title}`);
    
    return { status: 'processed' };
  }
}
