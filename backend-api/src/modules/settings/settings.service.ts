import { Injectable, NotFoundException } from '@nestjs/common';
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
