/**
 * Fresh Seed Script
 * Usage: node seed_fresh.js
 *
 * Clears existing products, categories, auctions, and related transactional data,
 * then seeds 6 premium categories and 10 highly realistic mixed-setup products.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// High-quality marketplace images from Pexels
const IMAGES = {
  vintageCars: [
    'https://images.pexels.com/photos/93612/pexels-photo-93612.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/34577/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1051073/pexels-photo-1051073.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  watches: [
    'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/280250/pexels-photo-280250.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  gems: [
    'https://images.pexels.com/photos/2733918/pexels-photo-2733918.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1413412/pexels-photo-1413412.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  bikes: [
    'https://images.pexels.com/photos/2626671/pexels-photo-2626671.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/21156/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/104842/bmw-motorcycle-motorcycle-bmw-motorrad-104842.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  crafts: [
    'https://images.pexels.com/photos/2162938/pexels-photo-2162938.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/172289/pexels-photo-172289.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  appliances: [
    'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800'
  ]
};

async function main() {
  console.log('🧹 1. Cleaning up transactional database tables...');

  // Delete dependencies in topological order to prevent foreign key errors
  await prisma.trackingEvent.deleteMany({});
  await prisma.shipping.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.bid.deleteMany({});
  await prisma.auctionExtension.deleteMany({});
  await prisma.watchlist.deleteMany({});
  await prisma.auction.deleteMany({});
  await prisma.productMedia.deleteMany({});
  await prisma.productAttributeValue.deleteMany({});
  await prisma.product.deleteMany({});

  console.log('🧹 2. Cleaning up categories and attributes...');
  await prisma.categoryAttribute.deleteMany({});
  await prisma.category.deleteMany({});

  console.log('👤 3. Checking existing Seller Profiles...');
  let seller = await prisma.sellerProfile.findFirst();
  if (!seller) {
    console.log('⚠️  No active seller profile found. Creating a default seller account...');
    let user = await prisma.user.findFirst({
      where: { email: 'seller@mototrad.com' }
    });

    if (!user) {
      let role = await prisma.role.findFirst({ where: { name: 'SELLER' } }) || await prisma.role.findFirst();
      if (!role) {
        role = await prisma.role.create({
          data: {
            name: 'SELLER',
            description: 'Seller User role'
          }
        });
      }
      user = await prisma.user.create({
        data: {
          email: 'seller@mototrad.com',
          username: 'sellershelby',
          passwordHash: '$2b$10$dummyHashToCompleteSeedSoPasswordFlowsWorkPerfect12345',
          firstName: 'Shelby',
          lastName: 'Motors',
          phone: '+15550199',
          status: 'ACTIVE',
          roleId: role.id,
          isEmailVerified: true
        }
      });
    }

    seller = await prisma.sellerProfile.create({
      data: {
        userId: user.id,
        companyName: 'Shelby Heritage Collection',
        taxId: 'TX-998811-A',
        businessAddress: '100 Carroll Shelby Way, Las Vegas, NV',
        isVerified: true
      }
    });
  }
  console.log(`✅ Seller Profile ready: "${seller.companyName}" (ID: ${seller.id})`);

  console.log('🪣  4. Retrieving Baskets...');
  const baskets = await prisma.basket.findMany({ where: { isActive: true } });
  if (baskets.length === 0) {
    console.log('⚠️  No baskets found. Please run seed_baskets.js first or create one.');
    process.exit(1);
  }
  console.log(`✅ Loaded ${baskets.length} active event baskets.`);

  console.log('🏷️  5. Seeding 6 marketplace Categories...');
  const categoryTemplates = [
    { name: 'Vintage Cars', slug: 'vintage-cars', desc: 'Rare and iconic classic automobiles.' },
    { name: 'Luxury Watches', slug: 'luxury-watches', desc: 'Timeless horological masterpieces from top brands.' },
    { name: 'Gemstones', slug: 'gemstones', desc: 'Exquisite, high-carat natural gemstones.' },
    { name: 'Motorcycles', slug: 'motorcycles', desc: 'Classic, custom, and premium sport bikes.' },
    { name: 'Handicrafts', slug: 'handicrafts', desc: 'Unique hand-carved art, carpets, and sculptures.' },
    { name: 'Electrical Appliances', slug: 'electrical-appliances', desc: 'High-end smart home kitchen electronics and tools.' }
  ];

  const categories = {};
  for (const cat of categoryTemplates) {
    const created = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: cat.desc,
        isActive: true
      }
    });
    categories[cat.slug] = created.id;
    console.log(`   🏷️  Created: "${created.name}" (ID: ${created.id})`);
  }

  console.log('🏎️  6. Seeding 10 premium Products & Auctions...');

  const now = new Date();

  // Helper date builders
  const dateAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const dateAhead = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const productTemplates = [
    // 1. Live - Vintage Car (Featured)
    {
      title: '1967 Ford Mustang Shelby GT500',
      slug: '1967-ford-mustang-shelby-gt500',
      sku: 'SKU-MUSTANG-67',
      shortDescription: 'Unmatched raw muscle heritage. Features the legendary 428 Cobra Jet V8 engine.',
      description: 'This museum-grade 1967 Shelby GT500 is presented in classic Wimbleton White with Guardsman Blue stripes. Boasting matching numbers, this legendary vehicle underwent a total frame-off rotisserie restoration in 2021.',
      condition: 'USED_GOOD',
      quantity: 1,
      isFeatured: true,
      categorySlug: 'vintage-cars',
      media: IMAGES.vintageCars,
      useGlobalCommission: false,
      commissionEnabled: true,
      commissionType: 'FLAT',
      commissionAmount: 500,
      auction: {
        type: 'BID_AND_BUY',
        startingBid: 80000,
        currentBid: 85000,
        buyItNowPrice: 120000,
        bidIncrement: 1000,
        startTime: dateAgo(2),
        endTime: dateAhead(5),
        status: 'ACTIVE'
      }
    },
    // 2. Live - Rolex Submariner (Featured)
    {
      title: 'Rolex Submariner Date 126610LN',
      slug: 'rolex-submariner-date-126610ln',
      sku: 'SKU-ROLEX-SUB-126',
      shortDescription: 'The ultimate reference diver watch, fully boxed with papers.',
      description: 'Featuring a 41mm Oystersteel case, black Cerachrom ceramic bezel, and a robust Oyster bracelet, this Submariner is the absolute standard in high-end utility and style. Brand new with pristine papers dated April 2026.',
      condition: 'LIKE_NEW',
      quantity: 1,
      isFeatured: true,
      categorySlug: 'luxury-watches',
      media: IMAGES.watches,
      useGlobalCommission: true,
      auction: {
        type: 'BID_ONLY',
        startingBid: 10000,
        currentBid: 11200,
        bidIncrement: 200,
        startTime: dateAgo(1),
        endTime: dateAhead(3),
        status: 'ACTIVE'
      }
    },
    // 3. Live - Gemstone (Featured)
    {
      title: '2.5 Carat Natural Blue Sapphire',
      slug: '2-5-carat-natural-blue-sapphire',
      sku: 'SKU-SAPPHIRE-25',
      shortDescription: 'Certified royal blue sapphire with outstanding clarity and brilliant cushion cut.',
      description: 'An exceptional gemstone sourced from the historical mines of Ceylon (Sri Lanka). Weighs exactly 2.54 carats and comes with full GIA laboratory certification verifying natural origin and no heat treatment.',
      condition: 'NEW',
      quantity: 1,
      isFeatured: true,
      categorySlug: 'gemstones',
      media: IMAGES.gems,
      useGlobalCommission: false,
      commissionEnabled: true,
      commissionType: 'PERCENTAGE',
      commissionAmount: 8,
      auction: {
        type: 'BUY_NOW_ONLY',
        startingBid: 0,
        currentBid: 0,
        buyItNowPrice: 4500,
        bidIncrement: 0,
        startTime: dateAgo(1),
        endTime: dateAhead(10),
        status: 'ACTIVE'
      }
    },
    // 4. Live - Ducati SS (Featured)
    {
      title: '1974 Ducati 750 Super Sport',
      slug: '1974-ducati-750-super-sport',
      sku: 'SKU-DUCATI-74SS',
      shortDescription: 'Extremely rare round-case bevel-drive classic motorcycle in pristine running state.',
      description: 'One of the most desirable post-war vintage motorcycles on the planet. Masterfully restored in Italy, this round-case 750 Super Sport delivers timeless styling and an incredible exhaust tone.',
      condition: 'USED_GOOD',
      quantity: 1,
      isFeatured: true,
      categorySlug: 'motorcycles',
      media: IMAGES.bikes,
      useGlobalCommission: true,
      auction: {
        type: 'BID_AND_BUY',
        startingBid: 35000,
        currentBid: 38500,
        buyItNowPrice: 55000,
        bidIncrement: 500,
        startTime: dateAgo(3),
        endTime: dateAhead(4),
        status: 'ACTIVE'
      }
    },
    // 5. Live - Persian Silk Rug (Normal)
    {
      title: 'Handcrafted Persian Silk Qom Rug',
      slug: 'handcrafted-persian-silk-rug',
      sku: 'SKU-RUG-PERSIAN',
      shortDescription: 'Extremely fine weaving density featuring 100% natural silk and detailed floral patterns.',
      description: 'A genuine hand-knotted Qom masterpiece with over 1.2 million knots per square meter. Features deep ivory, turquoise, and ruby pigments. Preserved in pristine, showroom-perfect condition.',
      condition: 'USED_GOOD',
      quantity: 1,
      isFeatured: false,
      categorySlug: 'handicrafts',
      media: IMAGES.crafts,
      useGlobalCommission: false,
      commissionEnabled: true,
      commissionType: 'PERCENTAGE',
      commissionAmount: 10,
      auction: {
        type: 'BID_ONLY',
        startingBid: 1200,
        currentBid: 1450,
        bidIncrement: 50,
        startTime: dateAgo(3),
        endTime: dateAhead(7),
        status: 'ACTIVE'
      }
    },
    // 6. Live - Stand Mixer (Normal)
    {
      title: 'KitchenAid Pro Line 7-Quart Stand Mixer',
      slug: 'kitchenaid-pro-line-stand-mixer',
      sku: 'SKU-MIXER-KITCHENAID',
      shortDescription: 'Commercial-grade kitchen power with high-capacity bowl-lift design.',
      description: 'Engineered for standard heavy baking, this heavy-duty stand mixer features a powerful 1.3 HP motor. Complete with stainless steel flat beater, powerknead spiral dough hook, and wire whip.',
      condition: 'NEW',
      quantity: 1,
      isFeatured: false,
      categorySlug: 'electrical-appliances',
      media: IMAGES.appliances,
      useGlobalCommission: true,
      auction: {
        type: 'BUY_NOW_ONLY',
        startingBid: 0,
        currentBid: 0,
        buyItNowPrice: 650,
        bidIncrement: 0,
        startTime: dateAgo(1),
        endTime: dateAhead(7),
        status: 'ACTIVE'
      }
    },
    // 7. Upcoming - Jaguar Roadster (Normal)
    {
      title: '1961 Jaguar E-Type Series 1 Roadster',
      slug: '1961-jaguar-e-type-roadster',
      sku: 'SKU-JAGUAR-61ET',
      shortDescription: 'The pinnacle of British sports car styling. Beautifully restored flat-floor model.',
      description: 'Widely regarded as one of the most beautiful automobiles ever built. Features the matching-numbers 3.8-liter straight-six engine with triple SU carburetors, finished in stunning British Racing Green.',
      condition: 'REFURBISHED',
      quantity: 1,
      isFeatured: false,
      categorySlug: 'vintage-cars',
      media: IMAGES.vintageCars,
      useGlobalCommission: false,
      commissionEnabled: true,
      commissionType: 'FLAT',
      commissionAmount: 1000,
      auction: {
        type: 'BID_ONLY',
        startingBid: 120000,
        currentBid: 0,
        bidIncrement: 2000,
        startTime: dateAhead(2),
        endTime: dateAhead(9),
        status: 'PENDING'
      }
    },
    // 8. Live - Patek Watch (Normal)
    {
      title: 'Patek Philippe Calatrava 5196G',
      slug: 'patek-philippe-calatrava-5196g',
      sku: 'SKU-PATEK-CAL-5196',
      shortDescription: 'Classic dress watch elegance crafted in 18k white gold.',
      description: 'The epitome of high-end Swiss watches, this 37mm Calatrava features a timeless silver dial, black alligator strap, and a manual winding caliber 215 PS mechanism. Includes original velvet box and certified archives.',
      condition: 'LIKE_NEW',
      quantity: 1,
      isFeatured: false,
      categorySlug: 'luxury-watches',
      media: IMAGES.watches,
      useGlobalCommission: true,
      auction: {
        type: 'BID_AND_BUY',
        startingBid: 18000,
        currentBid: 18000,
        buyItNowPrice: 24000,
        bidIncrement: 500,
        startTime: dateAgo(0.5),
        endTime: dateAhead(2),
        status: 'ACTIVE'
      }
    },
    // 9. Live - Oak Jewelry Box (Normal)
    {
      title: 'Vintage Hand-Carved Oak Jewelry Box',
      slug: 'vintage-hand-carved-jewelry-box',
      sku: 'SKU-BOX-JEWELRY',
      shortDescription: 'Edwardian heritage box crafted with solid English oak and velvet inner lining.',
      description: 'Dating back to the early 1910s, this historic jewelry box features highly detailed hand-carved gothic leaf borders, secure brass hinges, and a functional skeleton lock with original key.',
      condition: 'USED_FAIR',
      quantity: 1,
      isFeatured: false,
      categorySlug: 'handicrafts',
      media: IMAGES.crafts,
      useGlobalCommission: false,
      commissionEnabled: true,
      commissionType: 'FLAT',
      commissionAmount: 20,
      auction: {
        type: 'BID_ONLY',
        startingBid: 150,
        currentBid: 210,
        bidIncrement: 10,
        startTime: dateAgo(3),
        endTime: dateAhead(6),
        status: 'ACTIVE'
      }
    },
    // 10. Upcoming - Harley Bike (Normal)
    {
      title: 'Harley-Davidson Sportster Iron 883',
      slug: 'harley-davidson-sportster-iron-883',
      sku: 'SKU-HARLEY-SPORT-883',
      shortDescription: 'Iconic blacked-out bobber styling with raw 883cc Evolution V-Twin power.',
      description: 'Features a customized denim black finish, drag-style handlebars, and upgraded Vance & Hines straight-shots exhaust. Kept in a climate-controlled garage, strictly single-owner with 800 miles.',
      condition: 'USED_GOOD',
      quantity: 1,
      isFeatured: false,
      categorySlug: 'motorcycles',
      media: IMAGES.bikes,
      useGlobalCommission: true,
      auction: {
        type: 'BID_AND_BUY',
        startingBid: 6500,
        currentBid: 0,
        buyItNowPrice: 9200,
        bidIncrement: 100,
        startTime: dateAhead(1),
        endTime: dateAhead(8),
        status: 'PENDING'
      }
    }
  ];

  for (let idx = 0; idx < productTemplates.length; idx++) {
    const p = productTemplates[idx];

    // Assign categories
    const categoryId = categories[p.categorySlug];
    if (!categoryId) {
      console.error(`❌ Category id not found for slug: ${p.categorySlug}`);
      continue;
    }

    // Assign a random basket from database
    const assignedBasket = baskets[idx % baskets.length];

    // Determine Product basePrice
    let basePrice = null;
    if (p.auction.buyItNowPrice > 0) {
      basePrice = p.auction.buyItNowPrice;
    } else if (p.auction.startingBid > 0) {
      basePrice = p.auction.startingBid;
    }

    // Create Product
    const createdProduct = await prisma.product.create({
      data: {
        title: p.title,
        slug: p.slug,
        sku: p.sku,
        shortDescription: p.shortDescription,
        description: p.description,
        quantity: p.quantity,
        isFeatured: p.isFeatured,
        condition: p.condition,
        basePrice: basePrice,
        status: 'IN_AUCTION',
        sellerId: seller.id,
        categoryId: categoryId,
        basketId: assignedBasket.id,
        useGlobalCommission: p.useGlobalCommission,
        commissionEnabled: p.commissionEnabled ?? false,
        commissionType: p.commissionType ?? 'NONE',
        commissionAmount: p.commissionAmount ?? null,
      }
    });

    console.log(`   🏎️  Created Product: "${createdProduct.title}" (ID: ${createdProduct.id})`);

    // Create Primary Media
    await prisma.productMedia.create({
      data: {
        productId: createdProduct.id,
        url: p.media[0],
        mediaType: 'IMAGE',
        isPrimary: true,
        sortOrder: 0
      }
    });

    // Create Gallery Media
    for (let mIdx = 1; mIdx < p.media.length; mIdx++) {
      await prisma.productMedia.create({
        data: {
          productId: createdProduct.id,
          url: p.media[mIdx],
          mediaType: 'IMAGE',
          isPrimary: false,
          sortOrder: mIdx
        }
      });
    }

    // Create Auction
    const createdAuction = await prisma.auction.create({
      data: {
        productId: createdProduct.id,
        status: p.auction.status,
        startingBid: p.auction.startingBid,
        currentBid: p.auction.currentBid,
        buyItNowPrice: p.auction.buyItNowPrice > 0 ? p.auction.buyItNowPrice : null,
        bidIncrement: p.auction.bidIncrement,
        startTime: p.auction.startTime,
        endTime: p.auction.endTime,
        type: p.auction.type,
      }
    });

    console.log(`      🔨 Created Auction: ${createdAuction.type} | Status: ${createdAuction.status} (ID: ${createdAuction.id})`);
  }

  console.log('\n🎉 Fresh marketplace data seeded successfully! 🚀\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during data seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
