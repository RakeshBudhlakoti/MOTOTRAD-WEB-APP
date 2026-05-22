import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaypalService } from '../paypal/paypal.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private prisma: PrismaService,
    private paypalService: PaypalService,
    private configService: ConfigService,
  ) {}

  async createSubscriptionOrder(userId: string) {
    const user: any = await (this.prisma.user as any).findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');
    if (user.isProMember) {
      throw new BadRequestException('User already has an active Pro Membership');
    }

    const membershipSetting = await this.prisma.setting.findUnique({
      where: { key: 'membership_fee' },
    });
    let fee = '5.00';
    if (membershipSetting) {
      try {
        fee = String(JSON.parse(membershipSetting.value));
      } catch {
        fee = membershipSetting.value;
      }
    } else {
      fee = this.configService.get<string>('MEMBERSHIP_FEE') || '5.00';
    }

    const order = await this.paypalService.createOrder(fee);

    // Create a pending payment record
    await (this.prisma as any).subscriptionPayment.create({
      data: {
        userId,
        amount: parseFloat(fee),
        status: 'PENDING',
        paypalOrderId: order.id,
      },
    });

    return {
      orderId: order.id,
      approvalUrl: order.links.find((l: any) => l.rel === 'payer-action' || l.rel === 'approve')?.href,
    };
  }

  async captureSubscription(userId: string, orderId: string) {
    const payment = await (this.prisma as any).subscriptionPayment.findUnique({
      where: { paypalOrderId: orderId },
    });

    if (!payment) throw new NotFoundException('Payment record not found');
    if (payment.userId !== userId) throw new BadRequestException('Unauthorized payment capture');

    try {
      const capture = await this.paypalService.captureOrder(orderId);
      
      if (capture.status === 'COMPLETED') {
        const captureId = capture.purchase_units[0].payments.captures[0].id;
        
        await this.prisma.$transaction(async (tx) => {
          // 1. Update payment record
          await (tx as any).subscriptionPayment.update({
            where: { id: payment.id },
            data: {
              status: 'COMPLETED',
              paypalCaptureId: captureId,
            },
          });

          // 2. Create subscription record
          await (tx as any).subscription.create({
            data: {
              userId,
              status: 'ACTIVE',
              startDate: new Date(),
              endDate: null, // Lifetime
              payments: {
                connect: { id: payment.id }
              }
            },
          });

          // 3. Update user membership status
          await (tx.user as any).update({
            where: { id: userId },
            data: {
              isProMember: true,
              membershipStatus: 'ACTIVE',
              membershipExpiry: null, // Lifetime
            },
          });

          // 4. Create Audit Log
          await tx.auditLog.create({
            data: {
              userId,
              action: 'MEMBERSHIP_ACTIVATED',
              entityType: 'User',
              entityId: userId,
              newValues: { status: 'ACTIVE' },
            },
          });
        });

        const updatedUser = await this.prisma.user.findUnique({
          where: { id: userId },
          include: { role: true } as any
        }) as any;

        return { 
          status: 'SUCCESS', 
          message: 'Membership activated successfully',
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            username: updatedUser.username,
            role: updatedUser.role,
            isProMember: updatedUser.isProMember,
            membershipStatus: updatedUser.membershipStatus,
            membershipExpiry: updatedUser.membershipExpiry,
          }
        };
      } else {
        await (this.prisma as any).subscriptionPayment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });
        throw new BadRequestException('Payment capture failed');
      }
    } catch (error) {
      this.logger.error('Failed to capture subscription', error.stack || error.message);
      throw new BadRequestException(error.message);
    }
  }

  async getMembershipStatus(userId: string) {
    const user: any = await (this.prisma.user as any).findUnique({
      where: { id: userId },
      select: {
        isProMember: true,
        membershipStatus: true,
        membershipExpiry: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // Lifetime membership - no expiry check needed
    return user;
  }
}
