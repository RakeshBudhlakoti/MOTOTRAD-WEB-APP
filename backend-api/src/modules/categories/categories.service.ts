import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; description?: string; parentId?: string; imageUrl?: string; isActive?: boolean; isFeatured?: boolean }) {
    let slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    // Ensure slug uniqueness
    let existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    return this.prisma.category.create({
      data: {
        ...data,
        slug,
      }
    });
  }

  async findAll(params?: { includePastCount?: boolean; includeActiveCount?: boolean; search?: string; page?: number; limit?: number; tree?: boolean; isFeatured?: boolean }) {
    this.prisma.$connect();

    if (params?.tree) {
      // Return hierarchical tree structure (for dropdowns)
      return this.prisma.category.findMany({
        where: { parentId: null, isActive: true },
        include: { children: { include: { children: true } } },
        orderBy: { name: 'asc' },
      });
    }

    // Paginated / Searchable Flat List (for Admin Grid)
    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.search) {
      where.name = { contains: params.search, mode: 'insensitive' };
    }
    if (params?.isFeatured !== undefined) {
      where.isFeatured = params.isFeatured;
    }

    const [items, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        include: { 
          parent: true, 
          children: true,
          _count: {
            select: { products: true }
          }
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.category.count({ where })
    ]);

    const categories = items;

    if (params?.includePastCount || params?.includeActiveCount) {
      return Promise.all(
        categories.map(async (cat) => {
          const result: any = { 
            ...cat, 
            _count: { 
              pastAuctions: 0,
              activeAuctions: 0,
              products: cat._count?.products || 0
            } 
          };
          
          try {
            if (params.includePastCount) {
              const count = await this.prisma.auction.count({
                where: {
                  product: { categoryId: cat.id },
                  status: { in: ['ENDED_SOLD', 'ENDED_UNSOLD'] as any },
                },
              });
              result._count.pastAuctions = count;
            }

            if (params.includeActiveCount) {
              const count = await this.prisma.auction.count({
                where: {
                  product: { categoryId: cat.id },
                  status: 'ACTIVE',
                },
              });
              result._count.activeAuctions = count;
            }
          } catch (err) {
            // Log but don't fail the whole request
            console.error(`[CategoriesService] Error fetching counts for ${cat.name}:`, err.message);
          }
          
          return result;
        }),
      );
    }

    return {
      items: categories,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: true, attributes: true, _count: { select: { products: true } } },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: string, data: any) {
    let slug = undefined;
    if (data.name) {
      slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const existing = await this.prisma.category.findFirst({ where: { slug, id: { not: id } } });
      if (existing) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
      }
      data.slug = slug;
    }

    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    // Check if it has children
    const category = await this.prisma.category.findUnique({ where: { id }, include: { _count: { select: { children: true, products: true } } } });
    if (category?._count?.children || category?._count?.products) {
      throw new Error('Cannot delete category with active children or products. Please reassign them first.');
    }
    return this.prisma.category.delete({
      where: { id },
    });
  }
}
