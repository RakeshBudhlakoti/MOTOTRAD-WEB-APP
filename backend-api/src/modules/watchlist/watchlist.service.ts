import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WatchlistService {
  constructor(private prisma: PrismaService) {}

  async toggle(userId: string, auctionId: string) {
    const existing = await this.prisma.watchlist.findFirst({
      where: { userId, auctionId },
    });

    if (existing) {
      await this.prisma.watchlist.delete({ where: { id: existing.id } });
      return { added: false };
    }

    await this.prisma.watchlist.create({
      data: { userId, auctionId },
    });
    return { added: true };
  }

  async findAll(userId: string) {
    return this.prisma.watchlist.findMany({
      where: { userId },
      include: {
        auction: {
          include: { product: { include: { media: true } } },
        },
      },
    });
  }
}
