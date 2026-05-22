import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any, sellerId: string) {
    let slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let existing = await this.prisma.product.findFirst({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const { media, auction, thumbnail, gallery, ...productData } = data;

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        slug,
        sellerId: sellerId || productData.sellerId,
        media: {
          create: media?.map((m: any, i: number) => ({
            url: m.url,
            isPrimary: m.isPrimary || i === 0,
            mediaType: m.mediaType || 'IMAGE',
            sortOrder: i,
          })) || []
        },
        auctions: auction ? {
          create: {
            startingBid: auction.startingBid || 0,
            buyItNowPrice: auction.buyItNowPrice || null,
            reservePrice: auction.reservePrice || null,
            bidIncrement: auction.bidIncrement || 5,
            startTime: new Date(auction.startTime || Date.now()),
            endTime: new Date(auction.endTime),
            type: auction.type || 'BID_ONLY',
            status: productData.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING'
          }
        } : undefined
      },
      include: { media: true, auctions: true }
    });

    return product;
  }

  async findAll(query: any) {
    const { page = 1, limit = 10, categoryId, sellerId, search } = query;
    const skip = (page - 1) * limit;

    const where = {
      categoryId: categoryId || undefined,
      basketId: query.basketId || undefined,
      sellerId: sellerId || undefined,
      title: search ? { contains: search, mode: 'insensitive' as const } : undefined,
      deletedAt: null,
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: Number(limit),
        include: { 
          category: true, 
          media: { where: { isPrimary: true }, take: 1 },
          seller: true,
          auctions: {
             orderBy: { createdAt: 'desc' },
             take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
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
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { 
        category: true, 
        basket: true,
        media: { orderBy: { sortOrder: 'asc' } }, 
        seller: true,
        auctions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, data: any) {
    const { media, auction, ...productData } = data;

    let slug = undefined;
    if (productData.title) {
      slug = productData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const existing = await this.prisma.product.findFirst({ where: { slug, id: { not: id } } });
      if (existing) slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
      productData.slug = slug;
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: productData,
    });

    if (media && Array.isArray(media)) {
      await this.prisma.productMedia.deleteMany({ where: { productId: id } });
      await this.prisma.productMedia.createMany({
        data: media.map((m: any, i: number) => ({
          productId: id,
          url: m.url,
          isPrimary: m.isPrimary || i === 0,
          mediaType: m.mediaType || 'IMAGE',
          sortOrder: i,
        }))
      });
    }

    if (auction) {
      const existingAuction = await this.prisma.auction.findFirst({
        where: { productId: id },
        orderBy: { createdAt: 'desc' }
      });
      
      const auctionData = {
        startingBid: auction.startingBid || 0,
        buyItNowPrice: auction.buyItNowPrice || null,
        reservePrice: auction.reservePrice || null,
        bidIncrement: auction.bidIncrement || 5,
        startTime: auction.startTime ? new Date(auction.startTime) : undefined,
        endTime: auction.endTime ? new Date(auction.endTime) : undefined,
        type: auction.type || 'BID_ONLY',
        status: updated.status === 'ACTIVE' ? ('ACTIVE' as any) : undefined
      };

      if (existingAuction) {
        await this.prisma.auction.update({
          where: { id: existingAuction.id },
          data: auctionData
        });
      } else {
        await this.prisma.auction.create({
          data: {
            ...auctionData,
            productId: id,
            startTime: auctionData.startTime || new Date(),
            endTime: auctionData.endTime || new Date(),
            status: updated.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING'
          }
        });
      }
    }

    return updated;
  }

  async remove(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'UNAVAILABLE' },
    });
  }

  async relist(id: string, newEndTime: Date) {
    const product = await this.prisma.product.update({
      where: { id },
      data: { status: 'ACTIVE' }
    });

    const auction = await this.prisma.auction.findFirst({
      where: { productId: id },
      orderBy: { createdAt: 'desc' }
    });

    if (auction) {
      await this.prisma.auction.update({
        where: { id: auction.id },
        data: { 
          endTime: new Date(newEndTime),
          status: 'ACTIVE'
        }
      });
    }

    return product;
  }

  async addMedia(productId: string, data: any) {
    return this.prisma.productMedia.create({
      data: {
        productId,
        url: data.url,
        mediaType: data.mediaType || 'IMAGE',
        isPrimary: data.isPrimary || false,
        sortOrder: data.sortOrder || 0,
      },
    });
  }
}
