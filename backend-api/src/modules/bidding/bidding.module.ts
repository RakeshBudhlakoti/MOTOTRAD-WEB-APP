import { Module } from '@nestjs/common';
import { BiddingService } from './bidding.service';
import { BiddingController } from './bidding.controller';

@Module({
  imports: [],
  controllers: [BiddingController],
  providers: [BiddingService],
})
export class BiddingModule {}
