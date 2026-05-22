import { Module } from '@nestjs/common';
import { SettingsService } from '@/modules/settings/settings.service';
import { SettingsController } from '@/modules/settings/settings.controller';
import { PrismaModule } from '@/modules/prisma/prisma.module';
import { RedisModule } from '@/modules/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
