import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KycStatus } from '@prisma/client';

import { NotificationsService } from '@/modules/notifications/notifications.service';

@Injectable()
export class SellersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async registerSeller(userId: string, data: any) {
    const existing = await this.prisma.sellerProfile.findUnique({ where: { userId } });
    if (existing) throw new BadRequestException('User is already a seller');

    return this.prisma.sellerProfile.create({
      data: {
        userId,
        companyName: data.companyName,
        taxId: data.taxId,
        businessAddress: data.businessAddress,
      },
    });
  }

  async submitKyc(sellerId: string, data: any) {
    return this.prisma.sellerKyc.create({
      data: {
        sellerId,
        documentType: data.documentType,
        documentUrl: data.documentUrl,
        idNumber: data.idNumber,
        verificationStatus: 'PENDING',
      },
    });
  }

  async approveKyc(kycId: string, adminId: string) {
    const kyc = await this.prisma.sellerKyc.findUnique({ where: { id: kycId } });
    if (!kyc) throw new NotFoundException('KYC not found');

    const result = await this.prisma.$transaction([
      this.prisma.sellerKyc.update({
        where: { id: kycId },
        data: { verificationStatus: 'APPROVED', verifiedAt: new Date() },
      }),
      this.prisma.sellerProfile.update({
        where: { id: kyc.sellerId },
        data: { isVerified: true },
      }),
    ]);

    await this.notificationsService.notify(
      result[1].userId,
      'KYC_APPROVED',
      'Account Verified!',
      'Your seller account has been approved. You can now list auctions.'
    );

    return result;
  }

  async findAll(query: any = {}) {
    const { page = 1, limit = 100 } = query;
    return this.prisma.sellerProfile.findMany({
      include: { user: true },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
      orderBy: { companyName: 'asc' }
    });
  }

  async getSellerDashboard(sellerId: string) {
    const [stats, recentAuctions] = await Promise.all([
      this.prisma.auction.aggregate({
        where: { product: { sellerId } },
        _count: true,
        _sum: { currentBid: true },
      }),
      this.prisma.auction.findMany({
        where: { product: { sellerId } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { product: true },
      }),
    ]);

    return {
      stats: {
        totalAuctions: stats._count,
        totalSales: stats._sum.currentBid || 0,
      },
      recentAuctions,
    };
  }
}
