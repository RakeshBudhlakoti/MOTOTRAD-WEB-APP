import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { PrismaModule } from '@/modules/prisma/prisma.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { SettingsModule } from '@/modules/settings/settings.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    SettingsModule,
  ],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
