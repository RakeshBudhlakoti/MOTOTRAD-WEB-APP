import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CmsService {
  constructor(private prisma: PrismaService) {}

  async getPage(slug: string) {
    const page = await this.prisma.page.findUnique({
      where: { slug, isActive: true },
    });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async getBanners(position?: string) {
    return this.prisma.banner.findMany({
      where: { 
        isActive: true,
        position: position || undefined,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFaqs(category?: string) {
    return this.prisma.faq.findMany({
      where: { 
        isActive: true,
        category: category || undefined,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Admin Methods
  async createPage(data: any) {
    return this.prisma.page.create({ data });
  }

  async updatePage(id: string, data: any) {
    return this.prisma.page.update({
      where: { id },
      data,
    });
  }
}
