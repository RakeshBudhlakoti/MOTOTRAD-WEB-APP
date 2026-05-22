import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { OrderStatus } from '@prisma/client';
import { CommissionService } from '../commissions/commissions.service';
import { AuctionsGateway } from './auctions.gateway';

@Injectable()
export class AuctionCompletionService {
  private readonly logger = new Logger(AuctionCompletionService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private commissionService: CommissionService,
    private auctionsGateway: AuctionsGateway,
  ) {}

  @Cron('*/30 * * * * *')
  async handleAuctionCompletions() {
    this.logger.log('⌛ Checking for expired auctions...');

    // 1. Fetch expired ACTIVE auctions
    const expiredAuctions = await this.prisma.auction.findMany({
      where: {
        endTime: { lte: new Date() },
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    if (expiredAuctions.length === 0) {
      this.logger.log('✨ No auctions to process.');
      return;
    }

    this.logger.log(`Found ${expiredAuctions.length} expired auctions to process.`);

    for (const auction of expiredAuctions) {
      try {
        await this.processAuctionEnd(auction.id);
      } catch (err) {
        this.logger.error(`Failed to process end of auction ${auction.id}: ${err.message}`, err.stack);
      }
    }
  }

  private async processAuctionEnd(auctionId: string) {
    await this.prisma.$transaction(async (tx) => {
      // 1. Acquire transaction row lock on the auction using PostgreSQL FOR UPDATE
      const auctions: any[] = await tx.$queryRaw`
        SELECT * FROM "Auction" 
        WHERE id = ${auctionId} AND status = 'ACTIVE' 
        FOR UPDATE
      `;

      if (auctions.length === 0) {
        this.logger.log(`⚠️ Auction ${auctionId} has already been finalized by another thread.`);
        return;
      }

      const auction = auctions[0];
      const now = new Date();

      // 2. Fetch the highest valid bid
      const bids = await tx.bid.findMany({
        where: { 
          auctionId: auction.id, 
          status: 'VALID' 
        },
        orderBy: { amount: 'desc' },
        take: 1,
        include: { user: true },
      });
      const highestBid = bids[0];

      // 3. Fetch product details with seller
      const product = await tx.product.findUnique({
        where: { id: auction.productId },
        include: { seller: { include: { user: true } } },
      });

      if (highestBid) {
        // ==========================================
        // Case A (Bids Exist) -> COMPLETED & SOLD
        // ==========================================
        const highestBidAmount = Number(highestBid.amount);

        // A1. Update Auction Status to COMPLETED, winnerUserId, winningBidId, endedAt
        await tx.auction.update({
          where: { id: auction.id },
          data: {
            status: 'COMPLETED',
            winnerUserId: highestBid.userId,
            winningBidId: highestBid.id,
            endedAt: now,
            highestBidderId: highestBid.userId,
            currentBid: highestBid.amount,
          },
        });

        // A2. Update Product Status to SOLD, mark isSoldOut, soldOutBy, soldOutAt
        await tx.product.update({
          where: { id: auction.productId },
          data: {
            status: 'SOLD',
            isSoldOut: true,
            soldOutAt: now,
            soldOutBy: highestBid.userId,
          },
        });

        // A3. Calculate Commission
        const commissionResult = await this.commissionService.calculateCommission(
          auction.productId,
          highestBid.amount
        );

        const totalAmount = commissionResult.finalAmount;
        let minPercent = 10;
        if (product && !product.useGlobalUpfrontPayment && product.upfrontPaymentPercentage) {
          minPercent = Number(product.upfrontPaymentPercentage);
        } else {
          const globalPct = await tx.setting.findUnique({
            where: { key: 'upfront_payment_percentage' },
          });
          if (globalPct) {
            minPercent = parseFloat(globalPct.value);
          }
        }
        const depositAmount = (totalAmount * minPercent) / 100;

        // Calculate commission ratio and deposit commission
        const commissionRatio = totalAmount > 0 ? Number(commissionResult.commissionAmount) / totalAmount : 0;
        const depositCommission = depositAmount * commissionRatio;

        // A4. Create Order
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const order = await tx.order.create({
          data: {
            auctionId: auction.id,
            buyerId: highestBid.userId,
            sellerId: product.sellerId,
            orderNumber,
            totalAmount: totalAmount,
            baseAmount: commissionResult.baseAmount,
            commissionAmount: commissionResult.commissionAmount,
            commissionType: commissionResult.commissionType,
            commissionRate: commissionResult.commissionRate,
            finalAmount: totalAmount,
            status: OrderStatus.PENDING_PAYMENT,
          },
        });

        // A5. Create Pending Deposit Payment record
        await tx.payment.create({
          data: {
            orderId: order.id,
            amount: depositAmount,
            paymentType: 'DEPOSIT',
            status: 'PENDING',
            provider: 'PAYPAL',
            commissionAmount: depositCommission,
            finalAmount: depositAmount,
          },
        });

        this.logger.log(`✅ Auction ${auction.id} COMPLETED. Sold to ${highestBid.user.email} for $${highestBidAmount}`);

        // A6. Trigger Winner Email (with payment link context)
        this.emailService.sendAuctionWon(
          highestBid.user.email,
          product.title,
          highestBidAmount
        ).catch(e => this.logger.error(`Failed to send win email to ${highestBid.user.email}`, e));

        // A7. Trigger Admin Notification Email with invoice details
        this.emailService.sendAdminAuctionCompletedNotification({
          auctionTitle: product.title,
          winningBid: highestBidAmount,
          winnerEmail: highestBid.user.email,
          winnerName: `${highestBid.user.firstName} ${highestBid.user.lastName}`,
          endedAt: now,
          bidCount: (auction.bidCount || 0) + 1,
          commissionAmount: Number(commissionResult.commissionAmount),
          totalAmount: Number(totalAmount),
        }).catch(e => this.logger.error('Failed to notify admin of completed auction', e));

        // A8. Trigger Losers Email Notification
        try {
          const participants = await tx.bid.findMany({
            where: {
              auctionId: auction.id,
              userId: { not: highestBid.userId },
              status: 'VALID',
            },
            select: { user: { select: { email: true } } },
            distinct: ['userId'],
          });

          for (const participant of participants) {
            this.emailService.sendAuctionLost(
              participant.user.email,
              product.title,
              highestBidAmount
            ).catch(e => this.logger.error(`Failed to send lost email to ${participant.user.email}`, e));
          }
        } catch (err) {
          this.logger.error(`Failed to broadcast loser emails for auction ${auction.id}`, err);
        }

        // A9. Broadcast WebSocket 'auction_ended' event
        this.auctionsGateway.notifyAuctionEnded(
          auction.id,
          'COMPLETED',
          highestBid.userId
        );

      } else {
        // ==========================================
        // Case B (No Bids Exist) -> EXPIRED & UNSOLD
        // ==========================================

        // B1. Update Auction Status to EXPIRED, set endedAt
        await tx.auction.update({
          where: { id: auction.id },
          data: {
            status: 'EXPIRED',
            endedAt: now,
          },
        });

        this.logger.log(`❌ Auction ${auction.id} EXPIRED (No bids placed)`);

        // B2. Notify Seller
        if (product?.seller?.user) {
          this.emailService.sendAuctionUnsold(
            product.seller.user.email,
            product.title,
            0
          ).catch(e => this.logger.error(`Failed to send unsold email to ${product.seller.user.email}`, e));
        }

        // B3. Broadcast WebSocket 'auction_ended' event
        this.auctionsGateway.notifyAuctionEnded(
          auction.id,
          'EXPIRED'
        );
      }
    });
  }
}
