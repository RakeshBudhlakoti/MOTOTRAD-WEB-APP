import * as dotenv from 'dotenv';
dotenv.config();

// Route Prisma connection to RDS if running in production
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL_PROD) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_PROD;
  console.log('🌐 Seeding production database: routing Prisma to RDS...');
}

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function mapDates(item: any, dateFields: string[]) {
  const mapped = { ...item };
  for (const field of dateFields) {
    if (mapped[field] !== undefined && mapped[field] !== null) {
      mapped[field] = new Date(mapped[field]);
    }
  }
  return mapped;
}

async function main() {
  console.log('🌱 Starting database replication...');

  // 1. Read exported data
  const dumpPath = path.resolve(__dirname, 'local-db-dump.json');
  if (!fs.existsSync(dumpPath)) {
    console.error(`❌ Exported file not found at ${dumpPath}. Run 'node scripts/export-all-data.js' first.`);
    process.exit(1);
  }

  const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));

  // 2. Clear all tables on target database using TRUNCATE CASCADE
  console.log('🧹 Clearing all target database tables...');
  const tables = [
    'AuditLog', 'Watchlist', 'Notification', 'Report', 'ContactInquiry',
    'TrackingEvent', 'Shipping', 'Payment', 'Order', 'AuctionExtension',
    'Bid', 'Auction', 'ProductAttributeValue', 'ProductMedia', 'Product',
    'CategoryAttribute', 'Basket', 'Category', 'SellerKyc', 'SellerProfile',
    'SubscriptionPayment', 'Subscription', 'RolePermission', 'Permission',
    'User', 'Role', 'EmailTemplate', 'CmsPage', 'Banner', 'Page', 'Faq', 'Setting'
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
      console.log(`- Truncated ${table}`);
    } catch (e: any) {
      console.warn(`⚠️ Warning: failed to truncate ${table} (may not exist yet): ${e.message}`);
    }
  }
  console.log('✅ Target database cleared.');

  // 3. Insert records in dependency order

  // Role
  if (dump.role && dump.role.length > 0) {
    console.log('Inserting Roles...');
    await prisma.role.createMany({
      data: dump.role.map((r: any) => mapDates(r, ['createdAt', 'updatedAt'])),
    });
  }

  // Permission
  if (dump.permission && dump.permission.length > 0) {
    console.log('Inserting Permissions...');
    await prisma.permission.createMany({
      data: dump.permission.map((p: any) => mapDates(p, ['createdAt', 'updatedAt'])),
    });
  }

  // Category (pass 1: insert with parentId = null to prevent self-ref FK constraint errors)
  if (dump.category && dump.category.length > 0) {
    console.log('Inserting Categories (pass 1)...');
    await prisma.category.createMany({
      data: dump.category.map((c: any) => {
        const item = mapDates(c, ['createdAt', 'updatedAt', 'deletedAt']);
        item.parentId = null;
        return item;
      }),
    });
  }

  // Basket
  if (dump.basket && dump.basket.length > 0) {
    console.log('Inserting Baskets...');
    await prisma.basket.createMany({
      data: dump.basket.map((b: any) => mapDates(b, ['createdAt', 'updatedAt', 'deletedAt'])),
    });
  }

  // Setting
  if (dump.setting && dump.setting.length > 0) {
    console.log('Inserting Settings...');
    await prisma.setting.createMany({
      data: dump.setting.map((s: any) => mapDates(s, ['updatedAt'])),
    });
  }

  // EmailTemplate
  if (dump.emailTemplate && dump.emailTemplate.length > 0) {
    console.log('Inserting EmailTemplates...');
    await prisma.emailTemplate.createMany({
      data: dump.emailTemplate.map((e: any) => mapDates(e, ['createdAt', 'updatedAt'])),
    });
  }

  // CmsPage
  if (dump.cmsPage && dump.cmsPage.length > 0) {
    console.log('Inserting CmsPages...');
    await prisma.cmsPage.createMany({
      data: dump.cmsPage.map((c: any) => mapDates(c, ['createdAt', 'updatedAt'])),
    });
  }

  // Banner
  if (dump.banner && dump.banner.length > 0) {
    console.log('Inserting Banners...');
    await prisma.banner.createMany({
      data: dump.banner.map((b: any) => mapDates(b, ['createdAt', 'updatedAt'])),
    });
  }

  // Page
  if (dump.page && dump.page.length > 0) {
    console.log('Inserting Pages...');
    await prisma.page.createMany({
      data: dump.page.map((p: any) => mapDates(p, ['createdAt', 'updatedAt'])),
    });
  }

  // Faq
  if (dump.faq && dump.faq.length > 0) {
    console.log('Inserting Faqs...');
    await prisma.faq.createMany({
      data: dump.faq.map((f: any) => mapDates(f, ['createdAt', 'updatedAt'])),
    });
  }

  // ContactInquiry
  if (dump.contactInquiry && dump.contactInquiry.length > 0) {
    console.log('Inserting ContactInquiries...');
    await prisma.contactInquiry.createMany({
      data: dump.contactInquiry.map((c: any) => mapDates(c, ['repliedAt', 'createdAt', 'updatedAt'])),
    });
  }

  // Report
  if (dump.report && dump.report.length > 0) {
    console.log('Inserting Reports...');
    await prisma.report.createMany({
      data: dump.report.map((r: any) => mapDates(r, ['createdAt', 'updatedAt'])),
    });
  }

  // RolePermission
  if (dump.rolePermission && dump.rolePermission.length > 0) {
    console.log('Inserting RolePermissions...');
    await prisma.rolePermission.createMany({
      data: dump.rolePermission.map((rp: any) => mapDates(rp, ['createdAt', 'updatedAt'])),
    });
  }

  // User
  if (dump.user && dump.user.length > 0) {
    console.log('Inserting Users...');
    await prisma.user.createMany({
      data: dump.user.map((u: any) => mapDates(u, ['lastLoginAt', 'membershipExpiry', 'verificationTokenExpires', 'createdAt', 'updatedAt', 'deletedAt'])),
    });
  }

  // CategoryAttribute
  if (dump.categoryAttribute && dump.categoryAttribute.length > 0) {
    console.log('Inserting CategoryAttributes...');
    await prisma.categoryAttribute.createMany({
      data: dump.categoryAttribute,
    });
  }

  // SellerProfile
  if (dump.sellerProfile && dump.sellerProfile.length > 0) {
    console.log('Inserting SellerProfiles...');
    await prisma.sellerProfile.createMany({
      data: dump.sellerProfile.map((sp: any) => mapDates(sp, ['verifiedAt', 'createdAt', 'updatedAt', 'deletedAt'])),
    });
  }

  // Subscription
  if (dump.subscription && dump.subscription.length > 0) {
    console.log('Inserting Subscriptions...');
    await prisma.subscription.createMany({
      data: dump.subscription.map((s: any) => mapDates(s, ['startDate', 'endDate', 'createdAt', 'updatedAt'])),
    });
  }

  // Notification
  if (dump.notification && dump.notification.length > 0) {
    console.log('Inserting Notifications...');
    await prisma.notification.createMany({
      data: dump.notification.map((n: any) => mapDates(n, ['createdAt'])),
    });
  }

  // AuditLog
  if (dump.auditLog && dump.auditLog.length > 0) {
    console.log('Inserting AuditLogs...');
    await prisma.auditLog.createMany({
      data: dump.auditLog.map((a: any) => mapDates(a, ['createdAt'])),
    });
  }

  // Product
  if (dump.product && dump.product.length > 0) {
    console.log('Inserting Products...');
    await prisma.product.createMany({
      data: dump.product.map((p: any) => mapDates(p, ['soldOutAt', 'createdAt', 'updatedAt', 'deletedAt'])),
    });
  }

  // SubscriptionPayment
  if (dump.subscriptionPayment && dump.subscriptionPayment.length > 0) {
    console.log('Inserting SubscriptionPayments...');
    await prisma.subscriptionPayment.createMany({
      data: dump.subscriptionPayment.map((sp: any) => mapDates(sp, ['createdAt', 'updatedAt'])),
    });
  }

  // SellerKyc
  if (dump.sellerKyc && dump.sellerKyc.length > 0) {
    console.log('Inserting SellerKycs...');
    await prisma.sellerKyc.createMany({
      data: dump.sellerKyc.map((sk: any) => mapDates(sk, ['verifiedAt', 'createdAt', 'updatedAt'])),
    });
  }

  // ProductMedia
  if (dump.productMedia && dump.productMedia.length > 0) {
    console.log('Inserting ProductMedia...');
    await prisma.productMedia.createMany({
      data: dump.productMedia.map((pm: any) => mapDates(pm, ['createdAt', 'updatedAt'])),
    });
  }

  // ProductAttributeValue
  if (dump.productAttributeValue && dump.productAttributeValue.length > 0) {
    console.log('Inserting ProductAttributeValues...');
    await prisma.productAttributeValue.createMany({
      data: dump.productAttributeValue.map((pav: any) => mapDates(pav, ['createdAt', 'updatedAt'])),
    });
  }

  // Auction (pass 1: insert with winningBidId = null to resolve circular Bid dependency)
  if (dump.auction && dump.auction.length > 0) {
    console.log('Inserting Auctions (pass 1)...');
    await prisma.auction.createMany({
      data: dump.auction.map((auc: any) => {
        const item = mapDates(auc, ['startTime', 'endTime', 'lastBidAt', 'endedAt', 'createdAt', 'updatedAt', 'deletedAt']);
        item.winningBidId = null;
        return item;
      }),
    });
  }

  // Bid
  if (dump.bid && dump.bid.length > 0) {
    console.log('Inserting Bids...');
    await prisma.bid.createMany({
      data: dump.bid.map((b: any) => mapDates(b, ['createdAt'])),
    });
  }

  // AuctionExtension
  if (dump.auctionExtension && dump.auctionExtension.length > 0) {
    console.log('Inserting AuctionExtensions...');
    await prisma.auctionExtension.createMany({
      data: dump.auctionExtension.map((ae: any) => mapDates(ae, ['createdAt'])),
    });
  }

  // Watchlist
  if (dump.watchlist && dump.watchlist.length > 0) {
    console.log('Inserting Watchlists...');
    await prisma.watchlist.createMany({
      data: dump.watchlist.map((w: any) => mapDates(w, ['createdAt'])),
    });
  }

  // Pass 2: Restore Auction circular reference (winningBidId)
  if (dump.auction && dump.auction.length > 0) {
    console.log('Updating Auctions with winningBidId references...');
    for (const auc of dump.auction) {
      if (auc.winningBidId) {
        await prisma.auction.update({
          where: { id: auc.id },
          data: { winningBidId: auc.winningBidId },
        });
      }
    }
  }

  // Order
  if (dump.order && dump.order.length > 0) {
    console.log('Inserting Orders...');
    await prisma.order.createMany({
      data: dump.order.map((o: any) => mapDates(o, ['createdAt', 'updatedAt', 'deletedAt'])),
    });
  }

  // Payment
  if (dump.payment && dump.payment.length > 0) {
    console.log('Inserting Payments...');
    await prisma.payment.createMany({
      data: dump.payment.map((pay: any) => mapDates(pay, ['createdAt', 'updatedAt'])),
    });
  }

  // Shipping
  if (dump.shipping && dump.shipping.length > 0) {
    console.log('Inserting Shippings...');
    await prisma.shipping.createMany({
      data: dump.shipping.map((sh: any) => mapDates(sh, ['estimatedDelivery', 'createdAt', 'updatedAt'])),
    });
  }

  // TrackingEvent
  if (dump.trackingEvent && dump.trackingEvent.length > 0) {
    console.log('Inserting TrackingEvents...');
    await prisma.trackingEvent.createMany({
      data: dump.trackingEvent.map((te: any) => mapDates(te, ['eventDate', 'createdAt'])),
    });
  }

  // Pass 2: Restore Category parent self-references (parentId)
  if (dump.category && dump.category.length > 0) {
    console.log('Updating Categories with parentId self-references...');
    for (const cat of dump.category) {
      if (cat.parentId) {
        await prisma.category.update({
          where: { id: cat.id },
          data: { parentId: cat.parentId },
        });
      }
    }
  }

  console.log('🏁 Database replication completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Database replication failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
