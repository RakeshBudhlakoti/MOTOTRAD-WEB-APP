import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuctionDto, UpdateAuctionDto, AuctionQueryDto } from './dto/auction.dto';
import { Prisma } from '@prisma/client';

import { CommissionService } from '../commissions/commissions.service';

@Injectable()
export class AuctionsService {
  constructor(
    private prisma: PrismaService,
    private commissionService: CommissionService
  ) {}

  async calculateEstimatedCommission(productId: string, amount: number) {
    try {
      return await this.commissionService.calculateCommission(productId, amount);
    } catch (error) {
      return {
        baseAmount: amount,
        commissionAmount: 0,
        finalAmount: amount,
        commissionType: 'NONE'
      };
    }
  }

  async findAll(query: AuctionQueryDto) {
    const { search, status, category, basket, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * (Number(limit) || 10);

    const sortField = sortBy || 'createdAt';

    const where: Prisma.AuctionWhereInput = {
      deletedAt: null,
      ...(status === 'PAST' ? {
        status: { in: ['ENDED_SOLD', 'ENDED_UNSOLD'] }
      } : status === 'LIVE_AND_UPCOMING' ? {
        status: { in: ['ACTIVE', 'PENDING'] }
      } : status && {
        status: status as any
      }),
      ...(category && {
        product: {
          category: {
            slug: category,
          },
        },
      }),
      ...(basket && {
        product: {
          basket: {
            OR: [
              { slug: basket },
              { id: basket }
            ]
          }
        }
      }),
      ...(search && {
        product: {
          title: { contains: search, mode: 'insensitive' },
        },
      }),
    };

    let orderBy: any = [];
    if (sortBy === 'nearestExpiry') {
      orderBy.push({ endTime: 'asc' });
    } else if (sortBy === 'latestAdded') {
      orderBy.push({ createdAt: 'desc' });
    } else if (sortBy === 'priceLowToHigh') {
      orderBy.push({ startingBid: 'asc' });
    } else if (sortBy === 'priceHighToLow') {
      orderBy.push({ startingBid: 'desc' });
    } else if (sortBy === 'featuredFirst') {
      orderBy.push({ product: { isFeatured: 'desc' } });
      orderBy.push({ endTime: 'asc' });
    } else {
      if (status === 'ACTIVE' || status === 'LIVE_AND_UPCOMING') {
        orderBy.push({ product: { isFeatured: 'desc' } });
        orderBy.push({ endTime: 'asc' });
      } else {
        orderBy.push({ [sortField]: sortOrder });
      }
    }

    // 1. Fetch matching headers to sort
    const allAuctions = await this.prisma.auction.findMany({
      where,
      select: {
        id: true,
        type: true,
        currentBid: true,
        startingBid: true,
        buyItNowPrice: true,
        createdAt: true,
        endTime: true,
        product: {
          select: {
            isFeatured: true
          }
        }
      }
    });

    // Helper to calculate effective price for sorting
    const getEffectivePrice = (a: any) => {
      const currentBidVal = Number(a.currentBid);
      if (currentBidVal > 0) return currentBidVal;
      if (a.type === 'BUY_NOW_ONLY') return Number(a.buyItNowPrice || 0);
      return Number(a.startingBid);
    };

    // Sort in-memory globally
    allAuctions.sort((a: any, b: any) => {
      if (sortBy === 'nearestExpiry') {
        return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
      }
      if (sortBy === 'latestAdded') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'priceLowToHigh') {
        return getEffectivePrice(a) - getEffectivePrice(b);
      }
      if (sortBy === 'priceHighToLow') {
        return getEffectivePrice(b) - getEffectivePrice(a);
      }
      if (sortBy === 'featuredFirst') {
        const aFeat = a.product?.isFeatured ? 1 : 0;
        const bFeat = b.product?.isFeatured ? 1 : 0;
        if (aFeat !== bFeat) return bFeat - aFeat;
        return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
      }

      // Default fallback for active list
      if (status === 'ACTIVE' || status === 'LIVE_AND_UPCOMING') {
        const aFeat = a.product?.isFeatured ? 1 : 0;
        const bFeat = b.product?.isFeatured ? 1 : 0;
        if (aFeat !== bFeat) return bFeat - aFeat;
        return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
      }

      // Default chronological fallback
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = allAuctions.length;
    const p = Number(page) || 1;
    const l = Number(limit) || 10;
    const paginatedAuctions = allAuctions.slice((p - 1) * l, p * l);
    const paginatedIds = paginatedAuctions.map(a => a.id);

    let items = [];
    if (paginatedIds.length > 0) {
      const fullItems = await this.prisma.auction.findMany({
        where: {
          id: { in: paginatedIds }
        },
        include: {
          highestBidder: {
            select: {
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            }
          },
          product: {
            include: {
              media: true,
              category: true,
              basket: true,
            },
          },
        }
      });

      // Map back to maintain the exact sorted order
      items = paginatedIds.map(id => fullItems.find(item => item.id === id)).filter(Boolean);
    }

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
    const auction = await this.prisma.auction.findUnique({
      where: { id },
      include: {
        highestBidder: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          }
        },
        product: {
          include: {
            media: true,
            category: true,
            attributeValues: { include: { attribute: true } },
          },
        },
        bids: {
          orderBy: { amount: 'desc' },
          include: { 
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              }
            }
          },
        },
      },
    });

    if (!auction) throw new NotFoundException('Auction not found');
    return auction;
  }

  async create(dto: CreateAuctionDto) {
    return this.prisma.auction.create({
      data: {
        productId: dto.productId,
        startingBid: new Prisma.Decimal(dto.startingBid),
        reservePrice: dto.reservePrice ? new Prisma.Decimal(dto.reservePrice) : null,
        buyItNowPrice: dto.buyItNowPrice ? new Prisma.Decimal(dto.buyItNowPrice) : null,
        bidIncrement: new Prisma.Decimal(dto.bidIncrement),
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        status: 'PENDING',
      },
    });
  }

  async update(id: string, dto: UpdateAuctionDto) {
    return this.prisma.auction.update({
      where: { id },
      data: {
        startingBid: dto.startingBid ? new Prisma.Decimal(dto.startingBid) : undefined,
        reservePrice: dto.reservePrice ? new Prisma.Decimal(dto.reservePrice) : undefined,
        status: dto.status,
      },
    });
  }

  async pause(id: string) {
    return this.prisma.auction.update({
      where: { id },
      data: { status: 'PENDING' }, // Or a custom PAUSED status if added
    });
  }

  async endEarly(id: string) {
    const auction = await this.findOne(id);
    const finalStatus = auction.bidCount > 0 ? 'ENDED_SOLD' : 'ENDED_UNSOLD';
    
    return this.prisma.auction.update({
      where: { id },
      data: { 
        status: finalStatus as any,
        endTime: new Date(),
      },
    });
  }

  async relist(id: string, newEndTime: Date) {
    const original = await this.findOne(id);
    return this.prisma.auction.create({
      data: {
        productId: original.productId,
        startingBid: original.startingBid,
        reservePrice: original.reservePrice,
        bidIncrement: original.bidIncrement,
        startTime: new Date(),
        endTime: newEndTime,
        status: 'ACTIVE',
      },
    });
  }

  async remove(id: string) {
    return this.prisma.auction.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async removeBid(auctionId: string, bidId: string) {
    return this.prisma.$transaction(async (tx) => {
      const bid = await tx.bid.update({
        where: { id: bidId },
        data: { status: 'RETRACTED', isHighestBid: false },
      });

      const nextHighestBid = await tx.bid.findFirst({
        where: { auctionId, status: 'VALID' },
        orderBy: { amount: 'desc' },
      });

      const auction = await tx.auction.update({
        where: { id: auctionId },
        data: {
          currentBid: nextHighestBid ? nextHighestBid.amount : 0,
          highestBidderId: nextHighestBid ? nextHighestBid.userId : null,
          bidCount: { decrement: 1 },
        },
      });

      if (nextHighestBid) {
        await tx.bid.update({
          where: { id: nextHighestBid.id },
          data: { isHighestBid: true }
        });
      }

      return { auction, nextHighestBid };
    });
  }
}
