import { Injectable, BadRequestException, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PaymentProvider } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { PaypalService } from '../paypal/paypal.service';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { AuctionsGateway } from '../auctions/auctions.gateway';
import { CommissionService } from '../commissions/commissions.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private paypalService: PaypalService,
    private redisService: RedisService,
    private emailService: EmailService,
    private configService: ConfigService,
    private auctionsGateway: AuctionsGateway,
    private commissionService: CommissionService,
    private notificationsService: NotificationsService,
  ) {}

  async createBuyNowOrder(userId: string, auctionId: string, isPartial: boolean = false) {
    const lockKey = `buynow:${auctionId}`;
    const locked = await this.redisService.lock(lockKey, 10000); // 10 second lock

    if (!locked) {
      throw new BadRequestException('Transaction in progress for this auction. Please try again.');
    }

    try {
      // 1. Validate User and Auction
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      if (!user.isProMember) {
        throw new BadRequestException('Pro Membership required for Buy Now');
      }

      const auction = await this.prisma.auction.findUnique({
        where: { id: auctionId },
        include: { product: { include: { seller: true } } }
      });

      if (!auction) throw new NotFoundException('Auction not found');
      const now = new Date();
      if (auction.status !== 'ACTIVE' || now >= auction.endTime) {
        throw new ForbiddenException({
          statusCode: 403,
          error: 'Forbidden',
          message: 'This auction has ended.',
          code: 'AUCTION_EXPIRED'
        });
      }
      if (!auction.buyItNowPrice) throw new BadRequestException('Buy Now is not available for this auction');
      if (auction.product.isSoldOut) throw new BadRequestException('Product is already sold out');

      // Check Buy Now active bidding business rules
      const allowAfterBidsSetting = await this.prisma.setting.findUnique({
        where: { key: 'ALLOW_BUY_NOW_AFTER_BIDS' }
      });
      const allowAfterBids = allowAfterBidsSetting ? allowAfterBidsSetting.value === 'true' : false;

      if (!allowAfterBids && (auction.product.buyNowDisabled || auction.bidCount > 0)) {
        throw new ForbiddenException({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Buy Now is disabled for this product due to active bidding.',
          code: 'BUY_NOW_DISABLED_ACTIVE_BIDDING'
        });
      }

      // 1.5. Clean up any existing pending orders for this auction to avoid unique constraint violations
      const existingOrder = await this.prisma.order.findUnique({
        where: { auctionId }
      });
      if (existingOrder) {
        if (existingOrder.status === 'PENDING_PAYMENT') {
          this.logger.log(`Found stale pending order ${existingOrder.id} for auction ${auctionId}. Deleting to allow fresh retry...`);
          await this.prisma.payment.deleteMany({ where: { orderId: existingOrder.id } });
          await this.prisma.shipping.deleteMany({ where: { orderId: existingOrder.id } });
          await this.prisma.order.delete({ where: { id: existingOrder.id } });
        } else {
          throw new BadRequestException('An order has already been processed for this auction.');
        }
      }

      // 2. Calculate Commission
      this.logger.log(`Calculating commission for product ${auction.productId} and amount ${auction.buyItNowPrice}`);
      const commissionResult = await this.commissionService.calculateCommission(
        auction.productId,
        auction.buyItNowPrice
      );
      this.logger.log(`Commission result: ${JSON.stringify(commissionResult)}`);

      const totalAmount = commissionResult.finalAmount;
      let paymentAmount = totalAmount;

      if (isPartial) {
        let minPercent = 20;
        if (!auction.product.useGlobalUpfrontPayment && auction.product.upfrontPaymentPercentage) {
          minPercent = Number(auction.product.upfrontPaymentPercentage);
        } else {
          const globalPct = await this.prisma.setting.findUnique({
            where: { key: 'upfront_payment_percentage' },
          });
          if (globalPct) {
            minPercent = parseFloat(globalPct.value);
          }
        }
        paymentAmount = (totalAmount * minPercent) / 100;
      }
      this.logger.log(`Total: ${totalAmount}, Payment: ${paymentAmount}`);

      // Calculate commission portion for this specific payment
      const commissionRatio = totalAmount > 0 ? commissionResult.commissionAmount / totalAmount : 0;
      const paymentCommission = paymentAmount * commissionRatio;

      // 3. Create PayPal Order
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      this.logger.log(`Creating PayPal order for amount: ${paymentAmount.toFixed(2)}`);
      // Sanitize description: remove special characters that might upset PayPal
      const sanitizedTitle = auction.product.title.replace(/[()%/]/g, '').substring(0, 120);
      const paypalOrder = await this.paypalService.createOrder(
        paymentAmount.toFixed(2), 
        'USD', 
        `Buy Now: ${sanitizedTitle}`
      );
      this.logger.log(`PayPal order created: ${paypalOrder.id}`);

      // 4. Create Pending Order Record
      this.logger.log(`Creating order record in database...`);
      let order;
      try {
        order = await this.prisma.order.create({
          data: {
            auctionId,
            buyerId: userId,
            sellerId: auction.product.seller.id,
            orderNumber,
            totalAmount: totalAmount,
            baseAmount: commissionResult.baseAmount,
            commissionAmount: commissionResult.commissionAmount,
            commissionType: commissionResult.commissionType,
            commissionRate: commissionResult.commissionRate,
            finalAmount: totalAmount,
            status: 'PENDING_PAYMENT',
            payments: {
              create: {
                amount: paymentAmount,
                provider: 'PAYPAL',
                status: 'PENDING',
                paymentType: isPartial ? 'DEPOSIT' : 'FULL',
                transactionId: paypalOrder.id,
                commissionAmount: paymentCommission,
                finalAmount: paymentAmount,
              }
            }
          }
        });
        this.logger.log(`Order record created: ${order.id}`);
      } catch (dbError) {
        this.logger.error(`Database error creating order: ${dbError.message}`, dbError.stack);
        throw dbError;
      }

      return {
        orderId: order.id,
        paypalOrderId: paypalOrder.id,
        approvalUrl: paypalOrder.links.find((l: any) => l.rel === 'approve' || l.rel === 'payer-action')?.href,
      };
    } catch (error) {
      this.logger.error(`Failed to initiate Buy Now order: ${error.message}`, error.stack);
      throw error;
    } finally {
      await this.redisService.unlock(lockKey);
    }
  }

  async captureBuyNowPayment(userId: string, paypalOrderId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { transactionId: paypalOrderId },
      include: { order: { include: { auction: { include: { product: true } } } } }
    });

    if (!payment) throw new NotFoundException('Payment record not found');
    if (payment.order.buyerId !== userId) throw new BadRequestException('Unauthorized payment capture');

    try {
      this.logger.log(`Capturing PayPal payment for order ${payment.orderId}, paypalOrderId ${paypalOrderId}`);
      const capture = await this.paypalService.captureOrder(paypalOrderId);
      this.logger.log(`Capture result status: ${capture.status}`);

      if (capture.status === 'COMPLETED') {
        const captures = capture.purchase_units?.[0]?.payments?.captures;
        if (!captures || captures.length === 0) {
          throw new Error('No capture found in PayPal response');
        }
        const captureId = captures[0].id;
        this.logger.log(`PayPal Capture ID: ${captureId}`);

        const result = await this.prisma.$transaction(async (tx) => {
          this.logger.log('Starting database transaction for payment capture...');
          // Update Payment
          await tx.payment.update({
            where: { id: payment.id },
            data: { 
              status: 'COMPLETED',
              paymentMethod: 'PAYPAL',
            }
          });

          // Update Order Status
          const isFull = payment.paymentType === 'FULL';
          const newStatus = isFull ? 'FULLY_PAID' : 'DEPOSIT_PAID';

          await tx.order.update({
            where: { id: payment.orderId },
            data: { status: newStatus as any }
          });

          // Mark Product as Sold Out
          await tx.product.update({
            where: { id: payment.order.auction.productId },
            data: {
              isSoldOut: true,
              soldOutAt: new Date(),
              soldOutBy: userId,
              status: 'SOLD'
            }
          });

          // End Auction
          await tx.auction.update({
            where: { id: payment.order.auctionId },
            data: { 
              status: 'ENDED_SOLD',
              highestBidderId: userId,
              currentBid: payment.order.totalAmount
            }
          });

          // Audit Log
          await tx.auditLog.create({
            data: {
              userId,
              action: 'BUY_NOW_PURCHASE',
              entityType: 'Auction',
              entityId: payment.order.auctionId,
              newValues: { orderId: payment.orderId, amount: payment.amount }
            }
          });

          // Notify Bidders
          const otherBidders = await tx.bid.findMany({
            where: { 
              auctionId: payment.order.auctionId,
              userId: { not: userId }
            },
            distinct: ['userId'],
            include: { user: true }
          });

          const buyer = await tx.user.findUnique({ where: { id: userId } });
          const auctionDetails = await tx.auction.findUnique({
            where: { id: payment.order.auctionId },
            include: { product: { include: { seller: { include: { user: true } } } } }
          });

          return { otherBidders, buyer, auctionDetails };
        });

        // ================= OUTSIDE TRANSACTION =================
        const { otherBidders, buyer, auctionDetails } = result;

        // 5. BroadCast to Websockets
        this.auctionsGateway.broadcastAuctionSoldOut(payment.order.auctionId, {
          buyerId: userId,
          amount: payment.order.totalAmount,
          soldOutAt: new Date()
        });

        // Notify Bidders
        for (const bid of otherBidders) {
          if (bid.user.email) {
            this.emailService.sendAuctionEndedNotification(
              bid.user.email,
              payment.order.auction.product.title,
              'SOLD_OUT'
            ).catch(e => this.logger.error(`Failed to send Sold Out notification to ${bid.user.email}`, e));
          }
        }

        // 6. Send in-app notifications to Admin, Buyer, and Seller
        try {
          const buyerUsername = buyer?.username || buyer?.email || 'buyer';
          const productTitle = auctionDetails?.product?.title || 'Vehicle';
          const sellerUserId = auctionDetails?.product?.seller?.userId;

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
              'ORDER_STATUS',
              'New Sales Order Placed',
              `Order ${payment.order.orderNumber} has been successfully created by @${buyerUsername} for ${productTitle}.`,
              { orderId: payment.orderId, amount: payment.order.finalAmount }
            );
          }

          // B. Notify Buyer
          await this.notificationsService.notify(
            userId,
            'ORDER_STATUS',
            'Order Placed Successfully',
            `Your order ${payment.order.orderNumber} for ${productTitle} has been placed.`,
            { orderId: payment.orderId }
          );

          // C. Notify Seller
          if (sellerUserId) {
            await this.notificationsService.notify(
              sellerUserId,
              'ORDER_STATUS',
              'Your Vehicle has been Sold!',
              `Congratulations! Your product ${productTitle} has been sold to @${buyerUsername} under order ${payment.order.orderNumber}.`,
              { orderId: payment.orderId }
            );
          }

          // D. Send Payment Confirmation Email
          if (buyer?.email) {
            const baseAmt = Number(payment.order.baseAmount || 0);
            const commAmt = Number(payment.order.commissionAmount || 0);
            const finalAmt = Number(payment.order.finalAmount || 0);
            const isFull = payment.paymentType === 'FULL';
            const paidAmt = Number(payment.amount || 0);
            const remainingAmt = isFull ? 0 : Math.max(0, finalAmt - paidAmt);
            const emailStatus = isFull ? 'FULLY_PAID' : 'DEPOSIT_PAID';

            await this.emailService.sendPaymentConfirmation(
              buyer.email,
              payment.order.orderNumber,
              paidAmt,
              {
                baseAmount: baseAmt,
                commissionAmount: commAmt,
                paidAmount: paidAmt,
                remainingAmount: remainingAmt,
                status: emailStatus
              }
            ).catch(e => this.logger.error('Failed to send Buy Now checkout email confirmation', e));
          }
        } catch (notiError) {
          this.logger.error(`Error sending in-app notifications: ${notiError.message}`);
        }

        return { success: true, orderId: payment.orderId };
      } else {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' }
        });
        throw new BadRequestException('Payment capture failed');
      }
    } catch (error) {
      this.logger.error('Failed to capture Buy Now payment', error.stack || error.message);
      throw new BadRequestException(error.message);
    }
  }

  async findAll(query?: any) {
    const { page = 1, limit = 10, status, search } = query || {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { buyer: { email: { contains: search, mode: 'insensitive' } } },
        { auction: { product: { title: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          buyer: { select: { firstName: true, lastName: true, email: true, username: true } },
          auction: { include: { product: true } },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        buyer: true,
        seller: true,
        auction: { include: { product: true } },
        payments: true,
        shipping: {
          include: {
            trackings: { orderBy: { eventDate: 'asc' } }
          }
        },
      }
    });
  }

  async updateStatus(id: string, status: any) {
    return this.prisma.order.update({
      where: { id },
      data: { status }
    });
  }

  async createBalancePayment(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true, auction: true }
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== userId) throw new BadRequestException('Unauthorized');
    if (order.status !== 'DEPOSIT_PAID' && order.status !== 'PARTIALLY_PAID' && order.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException('Order does not have an outstanding balance');
    }

    const paidAmount = order.payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    const remainingAmount = Number(order.totalAmount) - paidAmount;

    if (remainingAmount <= 0) {
      throw new BadRequestException('Order is already fully paid');
    }

    const commissionRatio = Number(order.totalAmount) > 0 ? Number(order.commissionAmount) / Number(order.totalAmount) : 0;
    const paymentCommission = remainingAmount * commissionRatio;

    const paypalOrder = await this.paypalService.createOrder(
      remainingAmount.toFixed(2),
      'USD',
      `Balance Payment: ${order.orderNumber}`
    );

    // Create a pending payment record for the balance
    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        amount: remainingAmount,
        provider: 'PAYPAL',
        status: 'PENDING',
        paymentType: 'BALANCE',
        transactionId: paypalOrder.id,
        commissionAmount: paymentCommission,
        finalAmount: remainingAmount,
      }
    });

    return {
      paypalOrderId: paypalOrder.id,
    };
  }

  async captureBalancePayment(userId: string, orderId: string, paypalOrderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true, auction: true }
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== userId) throw new BadRequestException('Unauthorized');

    const payment = await this.prisma.payment.findUnique({
      where: { transactionId: paypalOrderId }
    });

    if (!payment || payment.orderId !== orderId) {
      throw new NotFoundException('Payment record not found');
    }

    try {
      const capture = await this.paypalService.captureOrder(paypalOrderId);

      if (capture.status === 'COMPLETED') {
        const result = await this.prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: 'COMPLETED', paymentMethod: 'PAYPAL' }
          });

          await tx.order.update({
            where: { id: orderId },
            data: { status: 'FULLY_PAID' }
          });

          // Update Product Status
          await tx.product.update({
            where: { id: order.auction.productId },
            data: { 
              isSoldOut: true,
              soldOutAt: new Date(),
              soldOutBy: userId,
              status: 'SOLD'
            }
          });

          // Audit Log
          await tx.auditLog.create({
            data: {
              userId,
              action: 'BALANCE_PAYMENT_COMPLETED',
              entityType: 'Order',
              entityId: orderId,
              newValues: { amount: payment.amount }
            }
          });

          const buyer = await tx.user.findUnique({ where: { id: userId } });
          const auctionDetails = await tx.auction.findUnique({
            where: { id: order.auctionId },
            include: { product: { include: { seller: { include: { user: true } } } } }
          });

          return { buyer, auctionDetails };
        });

        // ================= OUTSIDE TRANSACTION =================
        const { buyer, auctionDetails } = result;

        // 6. Send in-app notifications to Admin, Buyer, and Seller
        try {
          const buyerUsername = buyer?.username || buyer?.email || 'buyer';
          const productTitle = auctionDetails?.product?.title || 'Vehicle';
          const sellerUserId = auctionDetails?.product?.seller?.userId;

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
              'ORDER_STATUS',
              'Order Fully Paid',
              `Order ${order.orderNumber} has been fully paid by @${buyerUsername}. Balance amount: $${payment.amount.toLocaleString()}.`,
              { orderId, amount: payment.amount }
            );
          }

          // B. Notify Buyer
          await this.notificationsService.notify(
            userId,
            'ORDER_STATUS',
            'Order Fully Paid',
            `Your final balance payment of $${payment.amount.toLocaleString()} for Order ${order.orderNumber} (${productTitle}) has been received successfully.`,
            { orderId }
          );

          // C. Notify Seller
          if (sellerUserId) {
            await this.notificationsService.notify(
              sellerUserId,
              'ORDER_STATUS',
              'Your Vehicle has been Fully Paid!',
              `Congratulations! The remaining balance of $${payment.amount.toLocaleString()} for vehicle ${productTitle} (Order ${order.orderNumber}) was fully paid by @${buyerUsername}.`,
              { orderId }
            );
          }

          // D. Send Payment Confirmation Email
          if (buyer?.email) {
            const baseAmt = Number(order.baseAmount || 0);
            const commAmt = Number(order.commissionAmount || 0);
            const finalAmt = Number(order.finalAmount || 0);
            await this.emailService.sendPaymentConfirmation(
              buyer.email,
              order.orderNumber,
              Number(payment.amount),
              {
                baseAmount: baseAmt,
                commissionAmount: commAmt,
                paidAmount: finalAmt,
                remainingAmount: 0,
                status: 'FULLY_PAID'
              }
            ).catch(e => this.logger.error('Failed to send balance payment email confirmation', e));
          }
        } catch (notiError) {
          this.logger.error(`Error sending balance capture notifications: ${notiError.message}`);
        }

        return { success: true };
      } else {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' }
        });
        throw new BadRequestException('Payment capture failed');
      }
    } catch (error) {
      this.logger.error('Failed to capture balance payment', error.stack || error.message);
      throw new BadRequestException(error.message);
    }
  }

  async initiateAuctionDeposit(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true, auction: true }
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== userId) throw new BadRequestException('Unauthorized');
    
    const depositPayment = order.payments.find(p => p.paymentType === 'DEPOSIT' && p.status === 'PENDING');
    if (!depositPayment) throw new BadRequestException('No pending deposit found for this order');

    const paypalOrder = await this.paypalService.createOrder(
      Number(depositPayment.amount).toFixed(2),
      'USD',
      `Auction Deposit: ${order.orderNumber}`
    );

    // Update the payment record with the PayPal order ID
    await this.prisma.payment.update({
      where: { id: depositPayment.id },
      data: { transactionId: paypalOrder.id }
    });

    return {
      paypalOrderId: paypalOrder.id,
    };
  }

  async captureAuctionDeposit(userId: string, orderId: string, paypalOrderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true, auction: true }
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== userId) throw new BadRequestException('Unauthorized');

    const payment = await this.prisma.payment.findUnique({
      where: { transactionId: paypalOrderId }
    });

    if (!payment || payment.orderId !== orderId) {
      throw new NotFoundException('Payment record not found');
    }

    try {
      const capture = await this.paypalService.captureOrder(paypalOrderId);

      if (capture.status === 'COMPLETED') {
        const result = await this.prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: 'COMPLETED', paymentMethod: 'PAYPAL' }
          });

          await tx.order.update({
            where: { id: orderId },
            data: { status: 'DEPOSIT_PAID' }
          });

          // Update Product Status
          await tx.product.update({
            where: { id: order.auction.productId },
            data: { 
              isSoldOut: true,
              soldOutAt: new Date(),
              soldOutBy: userId,
              status: 'SOLD'
            }
          });

          // Audit Log
          await tx.auditLog.create({
            data: {
              userId,
              action: 'AUCTION_DEPOSIT_COMPLETED',
              entityType: 'Order',
              entityId: orderId,
              newValues: { amount: payment.amount }
            }
          });

          const buyer = await tx.user.findUnique({ where: { id: userId } });
          const auctionDetails = await tx.auction.findUnique({
            where: { id: order.auctionId },
            include: { product: { include: { seller: { include: { user: true } } } } }
          });

          return { buyer, auctionDetails };
        });

        // ================= OUTSIDE TRANSACTION =================
        const { buyer, auctionDetails } = result;

        // 6. Send in-app notifications to Admin, Buyer, and Seller
        try {
          const buyerUsername = buyer?.username || buyer?.email || 'buyer';
          const productTitle = auctionDetails?.product?.title || 'Vehicle';
          const sellerUserId = auctionDetails?.product?.seller?.userId;

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
              'ORDER_STATUS',
              'Auction Deposit Paid',
              `Order ${order.orderNumber} deposit of $${payment.amount.toLocaleString()} has been paid by @${buyerUsername}.`,
              { orderId, amount: payment.amount }
            );
          }

          // B. Notify Buyer
          await this.notificationsService.notify(
            userId,
            'ORDER_STATUS',
            'Auction Deposit Paid',
            `Your deposit of $${payment.amount.toLocaleString()} for Order ${order.orderNumber} (${productTitle}) has been received successfully.`,
            { orderId }
          );

          // C. Notify Seller
          if (sellerUserId) {
            await this.notificationsService.notify(
              sellerUserId,
              'ORDER_STATUS',
              'Deposit Received for Vehicle!',
              `Deposit of $${payment.amount.toLocaleString()} for vehicle ${productTitle} (Order ${order.orderNumber}) was paid by @${buyerUsername}.`,
              { orderId }
            );
          }

          // D. Send Payment Confirmation Email
          if (buyer?.email) {
            const baseAmt = Number(order.baseAmount || 0);
            const commAmt = Number(order.commissionAmount || 0);
            const finalAmt = Number(order.finalAmount || 0);
            const paidAmt = Number(payment.amount);
            const remainingAmt = Math.max(0, finalAmt - paidAmt);
            await this.emailService.sendPaymentConfirmation(
              buyer.email,
              order.orderNumber,
              paidAmt,
              {
                baseAmount: baseAmt,
                commissionAmount: commAmt,
                paidAmount: paidAmt,
                remainingAmount: remainingAmt,
                status: 'DEPOSIT_PAID'
              }
            ).catch(e => this.logger.error('Failed to send deposit payment email confirmation', e));
          }
        } catch (notiError) {
          this.logger.error(`Error sending deposit capture notifications: ${notiError.message}`);
        }

        return { success: true };
      } else {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' }
        });
        throw new BadRequestException('Payment capture failed');
      }
    } catch (error) {
      this.logger.error('Failed to capture auction deposit', error.stack || error.message);
      throw new BadRequestException(error.message);
    }
  }

  async findByAuctionId(auctionId: string) {
    return this.prisma.order.findUnique({
      where: { auctionId },
      include: {
        buyer: true,
        seller: true,
        auction: { include: { product: true } },
        payments: true,
        shipping: true,
      }
    });
  }

  // --- Admin Order Actions ---

  async markCashPayment(orderId: string, amount: number, adminId: string, notes?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true, buyer: true }
    });

    if (!order) throw new NotFoundException('Order not found');

    const paidAmount = order.payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    const remainingAmount = Number(order.totalAmount) - paidAmount;
    if (amount > remainingAmount) throw new BadRequestException('Amount exceeds pending balance');

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      // 1. Create Cash Payment Record
      await tx.payment.create({
        data: {
          orderId,
          amount,
          provider: PaymentProvider.CASH,
          status: 'COMPLETED',
          paymentType: 'BALANCE',
          transactionId: `CASH-${Date.now()}`,
          paymentMethod: 'OFFLINE_CASH',
          finalAmount: amount
        }
      });

      // 2. Evaluate new Order Status
      const newPaidTotal = paidAmount + amount;
      const isFullyPaid = newPaidTotal >= Number(order.totalAmount);
      const newStatus = isFullyPaid ? 'FULLY_PAID' : 'PARTIALLY_PAID';

      // 3. Update Order with Status and optional remarks
      return await tx.order.update({
        where: { id: orderId },
        data: { 
          status: newStatus,
          adminRemarks: notes ? `${(order as any).adminRemarks || ''}\n[${new Date().toISOString()}] Cash Payment: ${notes}` : (order as any).adminRemarks
        }
      });
    });

    // 4. Audit Log (outside transaction)
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'OFFLINE_CASH_SETTLEMENT',
        entityType: 'Order',
        entityId: orderId,
        newValues: { amount, status: updatedOrder.status }
      }
    }).catch(e => this.logger.error('Failed to write offline cash settlement audit log', e));

    // 5. Send confirmation email and in-app notifications
    try {
      const finalOrder = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { payments: true, buyer: true }
      });

      if (finalOrder) {
        const onlineDeposit = finalOrder.payments
          .filter(p => p.status === 'COMPLETED' && (p.provider as any) !== 'CASH')
          .reduce((sum, p) => sum + Number(p.amount), 0);

        const cashPayment = finalOrder.payments
          .filter(p => p.status === 'COMPLETED' && (p.provider as any) === 'CASH')
          .reduce((sum, p) => sum + Number(p.amount), 0);

        const paidAmt = onlineDeposit + cashPayment;
        const remainingAmt = Math.max(0, Number(finalOrder.totalAmount) - paidAmt);

        if (finalOrder.buyer?.email) {
          const baseAmt = Number(finalOrder.baseAmount || 0);
          const commAmt = Number(finalOrder.commissionAmount || 0);

          await this.emailService.sendPaymentConfirmation(
            finalOrder.buyer.email,
            finalOrder.orderNumber,
            amount,
            {
              baseAmount: baseAmt,
              commissionAmount: commAmt,
              paidAmount: paidAmt,
              remainingAmount: remainingAmt,
              status: finalOrder.status,
              onlineDeposit,
              cashPayment
            }
          ).catch(e => this.logger.error('Failed to send cash settlement payment confirmation email', e));
        }

        // Notify Buyer
        await this.notificationsService.notify(
          finalOrder.buyerId,
          'ORDER_STATUS',
          finalOrder.status === 'FULLY_PAID' ? 'Order Fully Settled' : 'Payment Received',
          finalOrder.status === 'FULLY_PAID' 
            ? `Your order ${finalOrder.orderNumber} has been fully settled. Thank you for your payment!` 
            : `A cash payment of $${amount.toLocaleString()} has been received for order ${finalOrder.orderNumber}.`,
          { orderId }
        ).catch(e => this.logger.error('Failed to send cash settlement buyer notification', e));
      }
    } catch (err) {
      this.logger.error('Error in cash settlement post-processing', err);
    }

    return updatedOrder;
  }

  async addAdminRemark(orderId: string, remark: string, adminId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const newRemark = `${(order as any).adminRemarks || ''}\n[${new Date().toISOString()}] Admin ${adminId}: ${remark}`.trim();
    
    return this.prisma.order.update({
      where: { id: orderId },
      data: { adminRemarks: newRemark }
    });
  }

  async sendPaymentReminder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: true, payments: true, auction: { include: { product: true } } }
    });
    
    if (!order) throw new NotFoundException('Order not found');
    
    if (order.status === 'FULLY_PAID' || order.status === 'DELIVERED') {
      if (order.buyer.email) {
        const baseAmt = Number(order.baseAmount || 0);
        const commAmt = Number(order.commissionAmount || 0);
        const finalAmt = Number(order.finalAmount || 0);
        const paidAmt = order.payments?.filter((p: any) => p.status === 'COMPLETED').reduce((acc: number, p: any) => acc + Number(p.amount), 0) || 0;
        const remainingAmt = Math.max(0, finalAmt - paidAmt);

        await this.emailService.sendPaymentConfirmation(
          order.buyer.email,
          order.orderNumber,
          finalAmt,
          {
            baseAmount: baseAmt,
            commissionAmount: commAmt,
            paidAmount: paidAmt,
            remainingAmount: remainingAmt,
            status: order.status
          }
        );
      }
      return { success: true, message: 'Invoice successfully sent' };
    }

    // Email Dispatch (using detailed Payment Reminder layout)
    if (order.buyer.email) {
      const baseAmt = Number(order.baseAmount || 0);
      const commAmt = Number(order.commissionAmount || 0);
      const finalAmt = Number(order.finalAmount || 0);
      const paidAmt = order.payments?.filter((p: any) => p.status === 'COMPLETED').reduce((acc: number, p: any) => acc + Number(p.amount), 0) || 0;
      const remainingAmt = Math.max(0, finalAmt - paidAmt);

      await this.emailService.sendPaymentReminderEmail(
        order.buyer.email,
        order.orderNumber,
        order.auction.product.title,
        baseAmt,
        commAmt,
        paidAmt,
        remainingAmt
      );
    }
    
    return { success: true, message: 'Payment reminder dispatched' };
  }

  async generateInvoicePdf(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: true, auction: { include: { product: true } }, payments: true }
    });

    if (!order) throw new NotFoundException('Order not found');

    // In a real production scenario, you would trigger a lambda or use pdfkit to generate the buffer.
    // We return a mock S3 URL structure representing the invoice.
    this.logger.log(`Generating PDF Invoice for Order: ${order.orderNumber}`);
    
    return {
      url: `https://mototrad-invoices.s3.amazonaws.com/invoices/${order.orderNumber}.pdf`,
      orderNumber: order.orderNumber
    };
  }
}
