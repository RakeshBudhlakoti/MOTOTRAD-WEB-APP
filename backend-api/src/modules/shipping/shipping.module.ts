import { Module } from '@nestjs/common';
import { ShippingService } from '@/modules/shipping/shipping.service';
import { ShippingController } from '@/modules/shipping/shipping.controller';
import { PrismaModule } from '@/modules/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ShippingController],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}
