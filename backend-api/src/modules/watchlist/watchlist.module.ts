import { Module } from '@nestjs/common';
import { WatchlistService } from '@/modules/watchlist/watchlist.service';
import { WatchlistController } from '@/modules/watchlist/watchlist.controller';
import { PrismaModule } from '@/modules/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WatchlistController],
  providers: [WatchlistService],
  exports: [WatchlistService],
})
export class WatchlistModule {}
