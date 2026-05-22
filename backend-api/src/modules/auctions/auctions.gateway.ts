import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, UnauthorizedException, Logger, ForbiddenException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { RedisService } from '@/modules/redis/redis.service';
import { AuctionsService } from '@/modules/auctions/auctions.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

import { EmailService } from '@/modules/email/email.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/auctions',
})
export class AuctionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AuctionsGateway.name);

  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
    private auctionsService: AuctionsService,
    private prisma: PrismaService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
  ) {}

  broadcastAuctionSoldOut(auctionId: string, data: any) {
    this.server.emit('auction_sold_out', { auctionId, ...data });
    this.server.to(`auction:${auctionId}`).emit('auction_ended', { 
        reason: 'SOLD_OUT',
        ...data 
    });
  }

  broadcastAuctionUpdate(auctionId: string, data: any) {
    this.server.to(`auction:${auctionId}`).emit('auction_update', data);
  }

  async handleConnection(client: Socket) {
    try {
      let token = client.handshake.auth.token || client.handshake.headers.authorization;
      
      if (token) {
        // Clean up "Bearer " prefix if present
        token = token.replace('Bearer ', '');
        const payload = await this.jwtService.verifyAsync(token);
        client.data.user = payload;
      }
    } catch (err) {
      // Allow guest connections, user will be undefined
    }
  }

  handleDisconnect(client: Socket) {
    // Cleanup if needed
  }

  @SubscribeMessage('join_auction')
  async handleJoinAuction(
    @ConnectedSocket() client: Socket,
    @MessageBody('auctionId') auctionId: string,
  ) {
    client.join(`auction:${auctionId}`);
    
    // Send full current state including history
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        bids: {
          where: { status: 'VALID' },
          orderBy: { amount: 'desc' },
          take: 10,
          include: { user: { select: { firstName: true, lastName: true, email: true } } }
        }
      }
    });

    if (auction) {
      client.emit('auction_sync', {
        currentBid: auction.currentBid || auction.startingBid,
        endTime: auction.endTime,
        bidCount: auction.bidCount,
        onlineBidders: this.getRoomCount(`auction:${auctionId}`),
        history: auction.bids.map(b => ({
          amount: b.amount,
          userName: `${b.user.firstName} ${b.user.lastName[0]}.`,
          timestamp: b.createdAt
        }))
      });

      // Broadcast new count to the room
      this.broadcastRoomCount(auctionId);
    }
  }

  @SubscribeMessage('leave_auction')
  async handleLeaveAuction(
    @ConnectedSocket() client: Socket,
    @MessageBody('auctionId') auctionId: string,
  ) {
    client.leave(`auction:${auctionId}`);
    this.broadcastRoomCount(auctionId);
  }

  private getRoomCount(roomName: string): number {
    try {
        // Handle different adapter structures (Redis vs Default)
        const adapter = this.server.sockets?.adapter || (this.server as any).adapter;
        if (!adapter || !adapter.rooms) return 0;
        
        const room = adapter.rooms.get(roomName);
        return room ? room.size : 0;
    } catch (err) {
        this.logger.error(`Error getting room count for ${roomName}`, err);
        return 0;
    }
  }

  private broadcastRoomCount(auctionId: string) {
    const count = this.getRoomCount(`auction:${auctionId}`);
    this.server.to(`auction:${auctionId}`).emit('online_bidders_count', { 
        auctionId, 
        count 
    });
  }

  notifyAuctionEnded(auctionId: string, status: string, winnerId?: string) {
    this.server.to(`auction:${auctionId}`).emit('auction_ended', { 
        auctionId, 
        status,
        winnerId
    });
  }

  @SubscribeMessage('place_bid')
  async handlePlaceBid(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { auctionId: string; amount: number },
  ) {
    const user = client.data.user;
    if (!user) throw new UnauthorizedException('Authentication required to bid');

    const { auctionId, amount } = data;
    const lockKey = `bid:${auctionId}`;

    const locked = await this.redisService.lock(lockKey);
    if (!locked) {
      client.emit('bid_error', { message: 'Network busy, please retry in a second' });
      return;
    }

    try {
      // 1. Pre-transaction validation (Fast checks)
      const userData = await this.prisma.user.findUnique({ 
        where: { id: user.sub },
        include: { sellerProfile: { include: { kyc: true } } }
      });

      // Pro Membership Enforcement
      if (!userData.isProMember) {
        throw new Error('Pro Membership required to place bids. Please upgrade your account.');
      }
      if (userData.membershipExpiry && userData.membershipExpiry < new Date()) {
        await this.prisma.user.update({
          where: { id: user.sub },
          data: { isProMember: false, membershipStatus: 'EXPIRED' }
        });
        throw new Error('Your Pro Membership has expired. Please renew to continue bidding.');
      }

      // 2. Transactional processing (Critical path)
      const result = await this.prisma.$transaction(async (tx) => {
        const auction = await tx.auction.findUnique({
          where: { id: auctionId },
          include: { product: true }
        });

        const now = new Date();
        if (!auction || auction.status !== 'ACTIVE' || now >= auction.endTime) {
          throw new ForbiddenException({
            statusCode: 403,
            message: 'This auction has ended.',
            code: 'AUCTION_EXPIRED'
          });
        }

        
        // Anti-Shill: Seller cannot bid on own item
        if (auction.product.sellerId === userData.sellerProfile?.id) {
          throw new Error('Sellers cannot bid on their own products');
        }

        // Inventory check
        if (auction.product.isSoldOut) {
          throw new Error('This item is sold out and no longer accepting bids');
        }

        // KYC Enforcement
        if (userData.status !== 'ACTIVE') throw new Error('Account must be active to bid');

        const currentBid = Number(auction.currentBid || auction.startingBid);
        const minIncrement = Number(auction.bidIncrement);
        const minRequired = currentBid + minIncrement;

        if (amount < minRequired) {
          throw new Error(`Bid must be at least $${minRequired.toLocaleString()} (Minimum increment: $${minIncrement})`);
        }

        // Set all other bids for this auction as not highest
        await tx.bid.updateMany({
          where: { auctionId, isHighestBid: true },
          data: { isHighestBid: false }
        });

        // Create the bid
        const newBid = await tx.bid.create({
          data: {
            auctionId,
            userId: user.sub,
            amount: amount,
            status: 'VALID',
            isHighestBid: true,
          },
        });

        // Determine if we should disable Buy Now due to this first bid
        let buyNowDisabledUpdated = false;
        if (auction.bidCount === 0) {
          const allowAfterBidsSetting = await tx.setting.findUnique({
            where: { key: 'ALLOW_BUY_NOW_AFTER_BIDS' }
          });
          const allowAfterBids = allowAfterBidsSetting ? allowAfterBidsSetting.value === 'true' : false;
          if (!allowAfterBids) {
            await tx.product.update({
              where: { id: auction.productId },
              data: {
                buyNowDisabled: true,
                buyNowDisabledReason: 'ACTIVE_BIDDING'
              }
            });
            buyNowDisabledUpdated = true;
          }
        }

        // Get dynamic auction extension settings from DB
        const autoExtEnabled = await tx.setting.findUnique({ where: { key: 'auction_auto_extension' } });
        const isAutoExtEnabled = autoExtEnabled?.value === 'true';

        let finalEndTime = auction.endTime;
        let extended = false;
        const diffMs = auction.endTime.getTime() - now.getTime();

        if (isAutoExtEnabled) {
          const triggerSetting = await tx.setting.findUnique({ where: { key: 'auction_extension_trigger' } });
          const durationSetting = await tx.setting.findUnique({ where: { key: 'auction_extension_duration' } });
          const maxExtSetting = await tx.setting.findUnique({ where: { key: 'auction_max_extensions' } });

          const triggerSecs = triggerSetting?.value ? parseInt(triggerSetting.value, 10) : 10;
          const extensionSecs = durationSetting?.value ? parseInt(durationSetting.value, 10) : 10;
          const maxExtensions = maxExtSetting?.value ? parseInt(maxExtSetting.value, 10) : 5;

          // Check if within trigger window AND hasn't hit max extensions
          if (diffMs > 0 && diffMs < (triggerSecs * 1000) && (auction.extensionCount || 0) < maxExtensions) { 
            finalEndTime = new Date(auction.endTime.getTime() + (extensionSecs * 1000));
            extended = true;
            
            await tx.auctionExtension.create({
              data: {
                auctionId,
                userId: user.sub,
                extendedBySecs: extensionSecs,
                previousEndTime: auction.endTime,
                newEndTime: finalEndTime,
                reason: `LATE_BID_${extensionSecs}S_EXTENSION`,
              },
            });
          }
        }

        const previousHighestBidderId = auction.highestBidderId;

        const updatedAuction = await tx.auction.update({
          where: { id: auctionId },
          data: { 
            currentBid: amount,
            bidCount: { increment: 1 },
            highestBidderId: user.sub,
            endTime: finalEndTime,
            lastBidAt: now,
            extensionCount: extended ? { increment: 1 } : undefined,
          } as any,
          include: { product: true }
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            userId: user.sub,
            action: 'PLACE_BID',
            entityType: 'Auction',
            entityId: auctionId,
            newValues: { amount, bidId: newBid.id },
            ipAddress: client.handshake.address,
          }
        });

        return { newBid, updatedAuction, extended, previousHighestBidderId, buyNowDisabledUpdated };
      });

      // 3. Calculate Commission for Broadcast
      const commissionInfo = await this.auctionsService.calculateEstimatedCommission(
        result.updatedAuction.productId,
        amount
      );

      // 4. Broadcast Success
      this.server.to(`auction:${auctionId}`).emit('bid_placed', {
        amount: amount,
        userName: `${userData.firstName} ${userData.lastName[0]}.`,
        timestamp: new Date(),
        newEndTime: result.updatedAuction.endTime,
        extended: result.extended,
        commissionInfo // Include commission info in broadcast
      });

      // BroadCast highest bid updated to everyone
      this.server.emit('highest_bid_updated', {
        auctionId,
        amount,
        highestBidderId: user.sub,
        commissionInfo
      });

      // Broadcast Buy Now disabled if it changed
      if (result.buyNowDisabledUpdated) {
        this.server.to(`auction:${auctionId}`).emit('buy_now_disabled', {
          auctionId,
          buyNowDisabled: true
        });
      }

      // 5. Trigger Notifications & Emails
      try {
        const productWithSeller = await this.prisma.product.findUnique({
          where: { id: result.updatedAuction.productId },
          include: { seller: true }
        });
        const sellerUserId = productWithSeller?.seller?.userId;
        const buyerUsername = userData.username || userData.email || 'bidder';

        // A. Notify All Admins and Super Admins (System Alert Logs)
        const admins = await this.prisma.user.findMany({
          where: {
            role: {
              name: {
                in: ['ADMIN', 'SUPER_ADMIN']
              }
            }
          }
        });
        for (const admin of admins) {
          await this.notificationsService.notify(
            admin.id,
            'BID_PLACED',
            'New Bid Placed',
            `A new bid of $${amount.toLocaleString()} was placed by @${buyerUsername} on vehicle ${result.updatedAuction.product.title}.`,
            { productId: result.updatedAuction.productId, auctionId }
          );
        }

        // B. Notify Seller
        if (sellerUserId) {
          await this.notificationsService.notify(
            sellerUserId,
            'BID_PLACED',
            'New Bid Placed',
            `A new bid of $${amount.toLocaleString()} has been placed on your vehicle ${result.updatedAuction.product.title} by @${buyerUsername}.`,
            { productId: result.updatedAuction.productId, auctionId }
          );
        }

        // C. Notify PREVIOUS highest bidder that they've been outbid
        if (result.previousHighestBidderId && result.previousHighestBidderId !== user.sub) {
          const previousBidder = await this.prisma.user.findUnique({
            where: { id: result.previousHighestBidderId }
          });
          
          if (previousBidder) {
            // Trigger Outbid email
            this.emailService.sendOutbidNotification(
              previousBidder.email,
              result.updatedAuction.product.title,
              amount
            ).catch(e => this.logger.error('Failed to send outbid email', e));

            // Trigger Outbid in-app notification
            await this.notificationsService.notify(
              result.previousHighestBidderId,
              'BID_OUTBID',
              'You have been outbid!',
              `You have been outbid on vehicle ${result.updatedAuction.product.title}. The new highest bid is $${amount.toLocaleString()}.`,
              { productId: result.updatedAuction.productId, auctionId }
            );
          }
        }
      } catch (notiError) {
        this.logger.error('Failed to process bid in-app notifications/emails', notiError.stack || notiError.message);
      }

    } catch (error) {
      const response = error.response || {};
      client.emit('bid_error', { 
        message: response.message || error.message || 'Failed to place bid',
        code: response.code || 'BID_FAILED',
        statusCode: error.status || 500
      });
    } finally {
      await this.redisService.unlock(lockKey);
    }
  }

}

