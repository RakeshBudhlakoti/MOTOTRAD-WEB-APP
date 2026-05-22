import { Module } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuctionsController } from './auctions.controller';
import { PrismaModule } from '../prisma/prisma.module';

import { AuctionsGateway } from './auctions.gateway';
import { AuctionCompletionService } from './auction-completion.service';
import { EmailModule } from '../email/email.module';
import { AuthModule } from '../auth/auth.module';
import { CommissionsModule } from '../commissions/commissions.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, AuthModule, EmailModule, CommissionsModule, NotificationsModule],
  controllers: [AuctionsController],
  providers: [AuctionsService, AuctionsGateway, AuctionCompletionService],
  exports: [AuctionsService, AuctionsGateway],
})
export class AuctionsModule { }
