import { Module } from '@nestjs/common';
import { SellersService } from '@/modules/sellers/sellers.service';
import { SellersController } from '@/modules/sellers/sellers.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [SellersController],
  providers: [SellersService],
  exports: [SellersService],
})
export class SellersModule {}
