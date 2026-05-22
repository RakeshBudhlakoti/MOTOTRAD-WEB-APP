import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BidQueryDto, UpdateBidStatusDto } from './dto/bid.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BiddingService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: BidQueryDto) {
    const { 
      auctionId, 
      userId, 
      productId, 
      status, 
      fromDate, 
      toDate, 
      minAmount, 
      maxAmount, 
      page = 1, 
      limit = 10,
      search
    } = query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: Prisma.BidWhereInput = {
      ...(auctionId && { auctionId }),
      ...(userId && { userId }),
      ...(status && { status: status as any }),
      ...(productId && { auction: { productId } }),
      ...(search && {
        OR: [
          { user: { username: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { auction: { product: { title: { contains: search, mode: 'insensitive' } } } },
        ]
      }),
      ...((fromDate || toDate) && {
        createdAt: {
          ...(fromDate && { gte: new Date(fromDate) }),
          ...(toDate && { lte: new Date(toDate) }),
        },
      }),
      ...((minAmount || maxAmount) && {
        amount: {
          ...(minAmount && { gte: Number(minAmount) }),
          ...(maxAmount && { lte: Number(maxAmount) }),
        },
      }),
    };

    const [total, items] = await Promise.all([
      this.prisma.bid.count({ where }),
      this.prisma.bid.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
          auction: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  sku: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const bid = await this.prisma.bid.findUnique({
      where: { id },
      include: {
        user: true,
        auction: {
          include: {
            product: {
              include: {
                media: true,
                category: true,
              },
            },
            bids: {
              orderBy: { amount: 'desc' },
              take: 5,
              include: {
                user: {
                  select: {
                    username: true,
                    avatar: true,
                  }
                }
              }
            }
          },
        },
      },
    });

    if (!bid) throw new NotFoundException('Bid not found');
    return bid;
  }

  async updateStatus(id: string, dto: UpdateBidStatusDto, adminId: string) {
    const bid = await this.prisma.bid.findUnique({
      where: { id },
      include: { auction: true }
    });

    if (!bid) throw new NotFoundException('Bid not found');

    return this.prisma.$transaction(async (tx) => {
      const updatedBid = await tx.bid.update({
        where: { id },
        data: { status: dto.status as any },
      });

      // Recalculate highest bid and bid count for the auction
      // 1. Fetch all active bids (VALID or WINNING) ordered by amount descending
      const activeBids = await tx.bid.findMany({
        where: {
          auctionId: bid.auctionId,
          status: { in: ['VALID', 'WINNING'] }
        },
        orderBy: { amount: 'desc' }
      });

      const highestActiveBid = activeBids[0] || null;

      // 2. Set isHighestBid flag appropriately for all bids in this auction
      // First, set isHighestBid = false for all bids of this auction
      await tx.bid.updateMany({
        where: { auctionId: bid.auctionId },
        data: { isHighestBid: false }
      });

      // Then, set isHighestBid = true for the highest active bid if one exists
      if (highestActiveBid) {
        await tx.bid.update({
          where: { id: highestActiveBid.id },
          data: { isHighestBid: true }
        });
      }

      // 3. Update the auction details
      await tx.auction.update({
        where: { id: bid.auctionId },
        data: {
          currentBid: highestActiveBid ? highestActiveBid.amount : 0,
          highestBidderId: highestActiveBid ? highestActiveBid.userId : null,
          bidCount: activeBids.length,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'UPDATE_BID_STATUS',
          entityType: 'Bid',
          entityId: id,
          newValues: { status: dto.status, reason: dto.reason },
        },
      });

      return updatedBid;
    });
  }

  async getLiveBids(limit: number = 20) {
    return this.prisma.bid.findMany({
      where: {
        auction: {
          status: 'ACTIVE',
        },
      },
      include: {
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
        auction: {
          include: {
            product: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });
  }
}
