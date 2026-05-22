import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { EmailService } from './src/modules/email/email.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const emailService = app.get(EmailService);
  const targetEmail = 'rakeshbudhlakoti1991@gmail.com';

  console.log(`Sending test emails to ${targetEmail}...`);
  
  try {
    // 1. Activation
    await emailService.sendActivationEmail(
      targetEmail,
      'Rakesh Budhlakoti',
      'http://localhost:3000/auth/verify?token=test-token-123'
    );
    console.log('Activation email sent!');

    // 2. Welcome
    await emailService.sendWelcomeEmail(targetEmail, 'Rakesh Budhlakoti');
    console.log('Welcome email sent!');

    // 3. Outbid
    await emailService.sendOutbidNotification(targetEmail, '2023 Mercedes-Benz G63 AMG', 155000);
    console.log('Outbid email sent!');

    console.log('All test emails sent successfully!');
  } catch (error) {
    console.error('Failed to send email:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
