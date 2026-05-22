import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaypalService } from './paypal.service';
import { Prisma } from '@prisma/client';
import { SettingsService } from '../settings/settings.service';
import { CommissionService } from '../commissions/commissions.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private paypalService: PaypalService,
    private settingsService: SettingsService,
    private commissionService: CommissionService
  ) {}

  async createOrderFromAuction(auctionId: string, buyerId: string) {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: { product: true },
    });

    if (!auction || (auction.status !== 'ENDED_SOLD' && auction.status !== 'COMPLETED')) {
      throw new BadRequestException('Auction has not ended or is not sold');
    }

    // 1. Clean up any existing pending orders for this auction to avoid unique constraint violations
    const existingOrder = await this.prisma.order.findUnique({
      where: { auctionId }
    });
    if (existingOrder) {
      if (existingOrder.status === 'PENDING_PAYMENT') {
        await this.prisma.payment.deleteMany({ where: { orderId: existingOrder.id } });
        await this.prisma.shipping.deleteMany({ where: { orderId: existingOrder.id } });
        await this.prisma.order.delete({ where: { id: existingOrder.id } });
      } else {
        throw new BadRequestException('An order has already been processed for this auction.');
      }
    }

    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const winningBid = auction.currentBid;
    
    // 2. Calculate Commission using CommissionService
    const commissionResult = await this.commissionService.calculateCommission(
      auction.productId,
      winningBid,
    );

    const totalAmount = commissionResult.finalAmount;

    // 3. Upfront Deposit Percentage and Amount
    let minPercent = 10;
    if (!auction.product.useGlobalUpfrontPayment && auction.product.upfrontPaymentPercentage) {
      minPercent = Number(auction.product.upfrontPaymentPercentage);
    } else {
      const globalPctSetting = await this.settingsService.getByKey('upfront_payment_percentage');
      if (globalPctSetting) {
        minPercent = parseFloat(globalPctSetting);
      }
    }
    const depositAmount = (totalAmount * minPercent) / 100;
    const commissionRatio = totalAmount > 0 ? Number(commissionResult.commissionAmount) / totalAmount : 0;
    const depositCommission = depositAmount * commissionRatio;

    // 4. Create Order & Pending Deposit Payment in a transaction
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          auction: { connect: { id: auctionId } },
          buyer: { connect: { id: buyerId } },
          seller: { connect: { id: auction.product.sellerId } },
          orderNumber,
          totalAmount: totalAmount,
          baseAmount: commissionResult.baseAmount,
          commissionAmount: commissionResult.commissionAmount,
          commissionType: commissionResult.commissionType,
          commissionRate: commissionResult.commissionRate,
          finalAmount: totalAmount,
          feeAmount: commissionResult.commissionAmount, // legacy support
          status: 'PENDING_PAYMENT',
        },
      });

      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: depositAmount,
          provider: 'PAYPAL',
          status: 'PENDING',
          paymentType: 'DEPOSIT',
          commissionAmount: depositCommission,
          finalAmount: depositAmount,
        },
      });

      return order;
    });
  }

  async initiatePayment(orderId: string, type: 'DEPOSIT' | 'FULL') {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: true,
        auction: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) throw new BadRequestException('Order not found');

    let amountToPay = order.totalAmount.toNumber();
    
    if (type === 'DEPOSIT') {
      // Try to find if we already have a pending DEPOSIT payment record created!
      const depositPayment = order.payments.find(p => p.paymentType === 'DEPOSIT' && p.status === 'PENDING');
      if (depositPayment) {
        amountToPay = Number(depositPayment.amount);
      } else {
        // Fallback calculation using product-level settings
        let minPercent = 10;
        if (order.auction?.product) {
          const product = order.auction.product;
          if (!product.useGlobalUpfrontPayment && product.upfrontPaymentPercentage) {
            minPercent = Number(product.upfrontPaymentPercentage);
          } else {
            const globalPctSetting = await this.settingsService.getByKey('upfront_payment_percentage');
            if (globalPctSetting) {
              minPercent = parseFloat(globalPctSetting);
            }
          }
        } else {
          const globalPctSetting = await this.settingsService.getByKey('upfront_payment_percentage');
          if (globalPctSetting) {
            minPercent = parseFloat(globalPctSetting);
          }
        }
        amountToPay = (amountToPay * minPercent) / 100;
      }
    }

    const paypalOrder = await this.paypalService.createOrder(amountToPay);

    return {
      paymentUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${paypalOrder.id}`,
      paypalOrderId: paypalOrder.id,
    };
  }

  async handlePaypalWebhook(data: any) {
    const eventType = data.event_type;
    const resource = data.resource;

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const transactionId = resource.id;
      const amount = resource.amount.value;
      const customId = resource.custom_id; // Usually we pass orderId:type

      // Process payment in DB
      // Update order status to DEPOSIT_PAID or FULLY_PAID
    }
  }

  async getTransactionHistory(userId: string) {
    return this.prisma.payment.findMany({
      where: {
        order: { buyerId: userId },
      },
      include: { order: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
