import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { RedisService } from '@/modules/redis/redis.service';

@Injectable()
export class SettingsService {
  private readonly CACHE_KEY_PUBLIC = 'settings:public';
  private readonly CACHE_KEY_ALL = 'settings:all';

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService
  ) {}

  async getPublicSettings() {
    // Force clear the caches to ensure site_address loads immediately
    await this.redisService.del(this.CACHE_KEY_PUBLIC).catch(() => {});
    await this.redisService.del(this.CACHE_KEY_ALL).catch(() => {});

    // Force isPublic to true for site_address and social keys so they display immediately
    await this.prisma.setting.updateMany({
      where: { key: { in: ['site_address', 'social_facebook', 'social_instagram', 'social_twitter', 'social_pinterest'] } },
      data: { isPublic: true },
    }).catch(() => {});

    const settings = await this.prisma.setting.findMany({
      where: { isPublic: true },
    });
    const formatted = this.formatSettings(settings);

    // Compute dynamic Pro member stats
    try {
      const realProCount = await this.prisma.user.count({
        where: { isProMember: true }
      });
      // Return the exact count of Pro members from the database
      formatted['pro_bidders_count'] = realProCount;

      const topProUsers = await this.prisma.user.findMany({
        where: { isProMember: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          firstName: true,
          lastName: true,
          username: true,
          avatar: true
        }
      });

      // Default mock users to maintain aesthetic completeness
      const mockBidders = [
        { avatar: null, initial: 'A' },
        { avatar: null, initial: 'B' },
        { avatar: null, initial: 'C' }
      ];

      formatted['pro_bidders_avatars'] = topProUsers.map((u) => ({
        avatar: u.avatar || null,
        initial: (u.firstName?.[0] || u.username?.[0] || 'P').toUpperCase()
      }));

      // Pad with mock users if we have fewer than 3 pro users
      while (formatted['pro_bidders_avatars'].length < 3) {
        const mockIdx = formatted['pro_bidders_avatars'].length;
        formatted['pro_bidders_avatars'].push(mockBidders[mockIdx]);
      }
    } catch (dbErr) {
      console.error('Failed to compute pro member stats:', dbErr);
      formatted['pro_bidders_count'] = 2400;
      formatted['pro_bidders_avatars'] = [
        { avatar: null, initial: 'A' },
        { avatar: null, initial: 'B' },
        { avatar: null, initial: 'C' }
      ];
    }

    await this.redisService.set(this.CACHE_KEY_PUBLIC, formatted, 3600); // 1 hour
    return formatted;
  }

  async getAllSettings() {
    const cached = await this.redisService.get(this.CACHE_KEY_ALL);
    if (cached) return cached;

    const settings = await this.prisma.setting.findMany();
    const formatted = this.formatSettings(settings);
    await this.redisService.set(this.CACHE_KEY_ALL, formatted, 3600);
    return formatted;
  }

  async updateBulk(settings: Record<string, any>, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const results = [];
      for (const [key, value] of Object.entries(settings)) {
        const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
        
        const result = await tx.setting.upsert({
          where: { key },
          update: { value: valStr, isPublic: this.isKeyPublic(key) },
          create: { key, value: valStr, isPublic: this.isKeyPublic(key) },
        });
        results.push(result);
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'UPDATE_GENERAL_SETTINGS',
          entityType: 'Settings',
          newValues: settings,
        },
      });

      // Invalidate Cache
      await this.redisService.del(this.CACHE_KEY_PUBLIC);
      await this.redisService.del(this.CACHE_KEY_ALL);

      return this.formatSettings(results);
    });
  }

  private formatSettings(settings: any[]) {
    const formatted: Record<string, any> = {};
    settings.forEach((s) => {
      try {
        formatted[s.key] = JSON.parse(s.value);
      } catch {
        formatted[s.key] = s.value;
      }
    });
    return formatted;
  }

  private isKeyPublic(key: string): boolean {
    const publicKeys = [
      'site_title', 'site_tagline', 'site_logo', 'site_favicon',
      'commission_enabled', 'commission_type', 'commission_amount',
      'auction_auto_extension', 'auction_extension_trigger', 'auction_extension_duration',
      'support_phone', 'support_email', 'site_address', 
      'social_facebook', 'social_instagram', 'social_twitter', 'social_pinterest',
      'paypal_client_id', 'membership_fee', 'upfront_payment_percentage',
      'ALLOW_BUY_NOW_AFTER_BIDS'
    ];
    return publicKeys.includes(key);
  }

  async getDbStats() {
    const superAdminRole = await this.prisma.role.findFirst({
      where: { name: 'SUPER_ADMIN' },
    });
    if (!superAdminRole) {
      throw new NotFoundException('SUPER_ADMIN role not found in the database. Aborting query.');
    }
    const superAdminRoleId = superAdminRole.id;

    return {
      trackingEvents: await this.prisma.trackingEvent.count(),
      shippings: await this.prisma.shipping.count(),
      payments: await this.prisma.payment.count(),
      orders: await this.prisma.order.count(),
      bids: await this.prisma.bid.count(),
      auctionExtensions: await this.prisma.auctionExtension.count(),
      auctions: await this.prisma.auction.count(),
      productMedia: await this.prisma.productMedia.count(),
      productAttributeValues: await this.prisma.productAttributeValue.count(),
      products: await this.prisma.product.count(),
      watchlists: await this.prisma.watchlist.count(),
      sellerKycs: await this.prisma.sellerKyc.count(),
      sellerProfiles: await this.prisma.sellerProfile.count(),
      subscriptionPayments: await this.prisma.subscriptionPayment.count(),
      subscriptions: await this.prisma.subscription.count(),
      notifications: await this.prisma.notification.count(),
      reports: await this.prisma.report.count(),
      contactInquiries: await this.prisma.contactInquiry.count(),
      auditLogs: await this.prisma.auditLog.count(),
      users: await this.prisma.user.count({
        where: { roleId: { not: superAdminRoleId } },
      }),
      baskets: await this.prisma.basket.count(),
      categoryAttributes: await this.prisma.categoryAttribute.count(),
      categories: await this.prisma.category.count(),
    };
  }

  async cleanDatabase(adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const superAdminRole = await tx.role.findFirst({
        where: { name: 'SUPER_ADMIN' },
      });
      if (!superAdminRole) {
        throw new ConflictException('SUPER_ADMIN role not found in the database. Aborting cleanup transaction to prevent data loss.');
      }
      const superAdminRoleId = superAdminRole.id;

      // Get count of records in each table before deleting
      const stats = {
        trackingEvents: await tx.trackingEvent.count(),
        shippings: await tx.shipping.count(),
        payments: await tx.payment.count(),
        orders: await tx.order.count(),
        bids: await tx.bid.count(),
        auctionExtensions: await tx.auctionExtension.count(),
        auctions: await tx.auction.count(),
        productMedia: await tx.productMedia.count(),
        productAttributeValues: await tx.productAttributeValue.count(),
        products: await tx.product.count(),
        watchlists: await tx.watchlist.count(),
        sellerKycs: await tx.sellerKyc.count(),
        sellerProfiles: await tx.sellerProfile.count(),
        subscriptionPayments: await tx.subscriptionPayment.count(),
        subscriptions: await tx.subscription.count(),
        notifications: await tx.notification.count(),
        reports: await tx.report.count(),
        contactInquiries: await tx.contactInquiry.count(),
        auditLogs: await tx.auditLog.count({
          where: { userId: { not: adminId } },
        }),
        users: await tx.user.count({
          where: { roleId: { not: superAdminRoleId } },
        }),
        baskets: await tx.basket.count(),
        categoryAttributes: await tx.categoryAttribute.count(),
        categories: await tx.category.count(),
      };

      // Perform deletion in correct dependency order to satisfy foreign key constraints
      await tx.trackingEvent.deleteMany({});
      await tx.shipping.deleteMany({});
      await tx.payment.deleteMany({});
      await tx.order.deleteMany({});
      await tx.bid.deleteMany({});
      await tx.auctionExtension.deleteMany({});
      await tx.auction.deleteMany({});
      await tx.productMedia.deleteMany({});
      await tx.productAttributeValue.deleteMany({});
      await tx.product.deleteMany({});
      await tx.watchlist.deleteMany({});
      await tx.sellerKyc.deleteMany({});
      await tx.sellerProfile.deleteMany({});
      await tx.subscriptionPayment.deleteMany({});
      await tx.subscription.deleteMany({});
      await tx.notification.deleteMany({});
      await tx.report.deleteMany({});
      await tx.contactInquiry.deleteMany({});
      
      // Delete audit logs except this clean request if we want to trace it
      await tx.auditLog.deleteMany({
        where: { userId: { not: adminId } }
      });

      // Delete non-superadmin users
      await tx.user.deleteMany({
        where: { roleId: { not: superAdminRoleId } },
      });

      await tx.basket.deleteMany({});
      await tx.categoryAttribute.deleteMany({});
      await tx.category.deleteMany({});

      // Create a new Audit Log for the cleanup action itself
      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'CLEAN_DATABASE',
          entityType: 'Database',
          newValues: { stats },
        },
      });

      // Invalidate Cache
      await this.redisService.del(this.CACHE_KEY_PUBLIC).catch(() => {});
      await this.redisService.del(this.CACHE_KEY_ALL).catch(() => {});

      return {
        success: true,
        deleted: stats,
      };
    });
  }

  async getByKey(key: string) {
    const setting = await this.prisma.setting.findUnique({ where: { key } });
    if (!setting) return null;
    try {
      return JSON.parse(setting.value);
    } catch {
      return setting.value;
    }
  }

  async getSystemAdminEmail(): Promise<string> {
    const adminEmail = await this.getByKey('admin_email');
    if (adminEmail) return adminEmail;

    const supportEmail = await this.getByKey('support_email');
    if (supportEmail) return supportEmail;

    const emailFromAddress = await this.getByKey('email_from_address');
    if (emailFromAddress) return emailFromAddress;

    return 'admin@mototrad.com';
  }
}
