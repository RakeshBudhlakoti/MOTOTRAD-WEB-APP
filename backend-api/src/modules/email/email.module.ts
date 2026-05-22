import { Module, Global } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { EmailService } from '@/modules/email/email.service';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { SettingsModule } from '@/modules/settings/settings.module';
import { join } from 'path';

@Global()
@Module({
  imports: [
    SettingsModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get('SMTP_HOST') || 'smtp.gmail.com',
          port: Number(configService.get('SMTP_PORT')) || 587,
          secure: Number(configService.get('SMTP_PORT')) === 465, // true for 465, false for other ports
          auth: {
            user: configService.get('SMTP_USER'),
            pass: configService.get('SMTP_PASS'),
          },
        },
        defaults: {
          from: '"Mototrad Support" <support@mototrad.com>',
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule { }
