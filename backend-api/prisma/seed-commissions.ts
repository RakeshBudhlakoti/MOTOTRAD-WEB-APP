import { PrismaClient, CommissionType, AuctionType, ProductStatus, AuctionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding extensive commission test data...');

  // 1. Ensure we have a category
  const category = await prisma.category.upsert({
    where: { slug: 'automotive' },
    update: {},
    create: { name: 'Automotive', slug: 'automotive' },
  });

  // 2. Ensure we have a seller
  const user = await prisma.user.findFirst({ where: { role: { name: 'SELLER' } }, include: { role: true } });
  if (!user) {
    console.error('No seller found in database. Please run main seed first.');
    return;
  }
  
  const seller = await prisma.sellerProfile.findFirst({ where: { userId: user.id } });
  if (!seller) {
     console.error('No seller profile found for user.');
     return;
  }

  // 3. Set Global Settings
  await prisma.setting.upsert({ where: { key: 'commission_enabled' }, update: { value: 'true' }, create: { key: 'commission_enabled', value: 'true', isPublic: true } });
  await prisma.setting.upsert({ where: { key: 'commission_type' }, update: { value: 'PERCENTAGE' }, create: { key: 'commission_type', value: 'PERCENTAGE', isPublic: true } });
  await prisma.setting.upsert({ where: { key: 'commission_amount' }, update: { value: '5' }, create: { key: 'commission_amount', value: '5', isPublic: true } });
  await prisma.setting.upsert({ where: { key: 'min_commission_amount' }, update: { value: '10' }, create: { key: 'min_commission_amount', value: '10', isPublic: true } });

  console.log('Creating 9 products/auctions (3 of each type)...');

  const configs = [
    // --- BID_ONLY ---
    { type: AuctionType.BID_ONLY, title: 'Bid-Only Global (5%)', basePrice: 500, useGlobal: true },
    { type: AuctionType.BID_ONLY, title: 'Bid-Only Flat ($100)', basePrice: 1000, useGlobal: false, commType: CommissionType.FLAT, commAmt: 100 },
    { type: AuctionType.BID_ONLY, title: 'Bid-Only Perc (10% + Caps)', basePrice: 2000, useGlobal: false, commType: CommissionType.PERCENTAGE, commAmt: 10, min: 50, max: 150 },

    // --- BUY_NOW_ONLY ---
    { type: AuctionType.BUY_NOW_ONLY, title: 'Buy-Now Global (5%)', basePrice: 300, useGlobal: true },
    { type: AuctionType.BUY_NOW_ONLY, title: 'Buy-Now Flat ($25)', basePrice: 400, useGlobal: false, commType: CommissionType.FLAT, commAmt: 25 },
    { type: AuctionType.BUY_NOW_ONLY, title: 'Buy-Now Perc (15%)', basePrice: 600, useGlobal: false, commType: CommissionType.PERCENTAGE, commAmt: 15 },

    // --- BID_AND_BUY ---
    { type: AuctionType.BID_AND_BUY, title: 'Hybrid Global (5%)', basePrice: 1500, useGlobal: true },
    { type: AuctionType.BID_AND_BUY, title: 'Hybrid Flat ($200)', basePrice: 2500, useGlobal: false, commType: CommissionType.FLAT, commAmt: 200 },
    { type: AuctionType.BID_AND_BUY, title: 'Hybrid Perc (8%)', basePrice: 3500, useGlobal: false, commType: CommissionType.PERCENTAGE, commAmt: 8 },
  ];

  for (const config of configs) {
    await createTestProductAndAuction({
      title: config.title,
      basePrice: config.basePrice,
      useGlobalCommission: config.useGlobal,
      commissionType: config.commType || CommissionType.NONE,
      commissionAmount: config.commAmt || 0,
      minCommissionAmount: config.min || 0,
      maxCommissionAmount: config.max || 0,
      auctionType: config.type,
      sellerId: seller.id,
      categoryId: category.id,
    });
  }

  console.log('✅ Extensive Commission seed completed.');
}

async function createTestProductAndAuction(data: any) {
  const product = await prisma.product.create({
    data: {
      title: data.title,
      description: `Test product for ${data.title} with commission logic.`,
      condition: 'NEW',
      basePrice: data.basePrice,
      useGlobalCommission: data.useGlobalCommission,
      commissionEnabled: true,
      commissionType: data.commissionType,
      commissionAmount: data.commissionAmount,
      minCommissionAmount: data.minCommissionAmount,
      maxCommissionAmount: data.maxCommissionAmount,
      sku: `COMM-${Math.floor(Math.random() * 100000)}`,
      status: 'ACTIVE',
      sellerId: data.sellerId,
      categoryId: data.categoryId,
      media: {
        create: {
          url: 'https://images.pexels.com/photos/1149137/pexels-photo-1149137.jpeg?auto=compress&cs=tinysrgb&w=800',
          mediaType: 'IMAGE',
          isPrimary: true
        }
      }
    }
  });

  const basePrice = Number(product.basePrice);

  await prisma.auction.create({
    data: {
      productId: product.id,
      status: 'ACTIVE',
      type: data.auctionType,
      startingBid: basePrice,
      currentBid: basePrice,
      bidIncrement: 25,
      buyItNowPrice: data.auctionType !== AuctionType.BID_ONLY ? basePrice * 1.2 : null,
      startTime: new Date(),
      endTime: new Date(Date.now() + 86400000 * 3), // 3 days later
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
