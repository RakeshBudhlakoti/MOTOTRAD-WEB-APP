import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BasketsService {
  constructor(private prisma: PrismaService) {}

  private generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }

  async create(data: { name: string; slug?: string; description?: string; image?: string; isActive?: boolean; isFeatured?: boolean }) {
    let slug = data.slug || this.generateSlug(data.name);

    const existing = await this.prisma.basket.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    return this.prisma.basket.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        image: data.image,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
      },
    });
  }

  async findAll(params?: { search?: string; page?: number; limit?: number; isActive?: boolean; isFeatured?: boolean }) {
    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (params?.search) {
      where.name = { contains: params.search, mode: 'insensitive' };
    }
    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }
    if (params?.isFeatured !== undefined) {
      where.isFeatured = params.isFeatured;
    }

    const [items, total] = await Promise.all([
      this.prisma.basket.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: { select: { products: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.basket.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const basket = await this.prisma.basket.findFirst({
      where: { OR: [{ id }, { slug: id }], deletedAt: null },
      include: {
        _count: { select: { products: true } },
      },
    });
    if (!basket) throw new NotFoundException('Basket not found');
    return basket;
  }

  async update(id: string, data: any) {
    if (data.name && !data.slug) {
      data.slug = this.generateSlug(data.name);
      const existing = await this.prisma.basket.findFirst({
        where: { slug: data.slug, id: { not: id } },
      });
      if (existing) {
        data.slug = `${data.slug}-${Math.random().toString(36).substring(2, 6)}`;
      }
    }

    const { name, slug, description, image, isActive, isFeatured } = data;
    return this.prisma.basket.update({
      where: { id },
      data: { name, slug, description, image, isActive, isFeatured },
    });
  }

  async remove(id: string) {
    const basket = await this.prisma.basket.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!basket) throw new NotFoundException('Basket not found');

    if (basket._count.products > 0) {
      // Unassign products from basket before deleting
      await this.prisma.product.updateMany({
        where: { basketId: id },
        data: { basketId: null },
      });
    }

    return this.prisma.basket.delete({ where: { id } });
  }

  async toggleStatus(id: string) {
    const basket = await this.prisma.basket.findUnique({ where: { id } });
    if (!basket) throw new NotFoundException('Basket not found');
    return this.prisma.basket.update({
      where: { id },
      data: { isActive: !basket.isActive },
    });
  }
}
