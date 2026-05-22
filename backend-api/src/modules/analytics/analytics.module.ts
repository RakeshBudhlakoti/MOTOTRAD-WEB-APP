import { Module } from '@nestjs/common';
import { AnalyticsService } from '@/modules/analytics/analytics.service';
import { AnalyticsController } from '@/modules/analytics/analytics.controller';
import { PrismaModule } from '@/modules/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
