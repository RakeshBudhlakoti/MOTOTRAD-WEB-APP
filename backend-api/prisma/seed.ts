import { PrismaClient, UserStatus, KycStatus, KycDocType, ItemCondition, ProductStatus, AuctionStatus, AttrType, AuctionType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedSettings, seedBaskets, seedCategories } from './seed-data';

if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL_PROD) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_PROD;
} else if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:password@127.0.0.1:5432/mototrad?schema=public";
}

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Roles & Permissions
  console.log('Creating roles and permissions...');
  
  // Upsert the SUPER_ADMIN permission
  const superAdminPermission = await prisma.permission.upsert({
    where: { action_resource: { action: 'ALL', resource: 'ALL' } },
    update: {},
    create: { action: 'ALL', resource: 'ALL', description: 'Full access to all system modules' }
  });

  // Ensure default system permissions exist
  const defaultPerms = [
    { resource: 'users', action: 'create', description: 'Create users' },
    { resource: 'users', action: 'read', description: 'View users' },
    { resource: 'users', action: 'update', description: 'Update users' },
    { resource: 'users', action: 'delete', description: 'Delete users' },
    { resource: 'products', action: 'create', description: 'Create products' },
    { resource: 'products', action: 'read', description: 'View products' },
    { resource: 'products', action: 'update', description: 'Update products' },
    { resource: 'products', action: 'delete', description: 'Delete products' },
    { resource: 'orders', action: 'read', description: 'View orders' },
    { resource: 'orders', action: 'update', description: 'Update orders' },
    { resource: 'settings', action: 'read', description: 'View settings' },
    { resource: 'settings', action: 'update', description: 'Update settings' },
  ];

  for (const perm of defaultPerms) {
    await prisma.permission.upsert({
      where: { action_resource: { action: perm.action, resource: perm.resource } },
      update: {},
      create: perm
    });
  }

  // Fetch all permissions currently in database
  const allPermissions = await prisma.permission.findMany();

  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: { description: 'Super Administrator with ultimate permissions' },
    create: { name: 'SUPER_ADMIN', description: 'Super Administrator with ultimate permissions', isSystem: true },
  });

  // Link ALL Permissions to SUPER_ADMIN Role
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: perm.id }
    });
  }

  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN', description: 'System Administrator', isSystem: true },
    }),
    prisma.role.upsert({
      where: { name: 'SELLER' },
      update: {},
      create: { name: 'SELLER', description: 'Vehicle Seller', isSystem: true },
    }),
    prisma.role.upsert({
      where: { name: 'BUYER' },
      update: {},
      create: { name: 'BUYER', description: 'Regular Buyer', isSystem: true },
    }),
  ]);

  const adminRole = roles.find((r) => r.name === 'ADMIN')!;
  const sellerRole = roles.find((r) => r.name === 'SELLER')!;
  const buyerRole = roles.find((r) => r.name === 'BUYER')!;

  // 2. Create Users
  console.log('Creating users...');
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const superAdminPasswordHash = await bcrypt.hash('SuperAdmin123!', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@mototrad.com' },
    update: {
      roleId: superAdminRole.id,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
    create: {
      email: 'superadmin@mototrad.com',
      username: 'superadmin',
      passwordHash: superAdminPasswordHash,
      firstName: 'Super',
      lastName: 'Admin',
      status: UserStatus.ACTIVE,
      roleId: superAdminRole.id,
      isEmailVerified: true,
    },
  });

  const superuserPasswordHash = await bcrypt.hash('Admin@123*', 10);
  const superuser = await prisma.user.upsert({
    where: { email: 'rbkstaging@gmail.com' },
    update: {
      roleId: superAdminRole.id,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      username: 'superuser',
      passwordHash: superuserPasswordHash,
    },
    create: {
      email: 'rbkstaging@gmail.com',
      username: 'superuser',
      passwordHash: superuserPasswordHash,
      firstName: 'Super',
      lastName: 'User',
      status: UserStatus.ACTIVE,
      roleId: superAdminRole.id,
      isEmailVerified: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mototrad.com' },
    update: {},
    create: {
      email: 'admin@mototrad.com',
      passwordHash,
      firstName: 'System',
      lastName: 'Admin',
      status: UserStatus.ACTIVE,
      roleId: adminRole.id,
      isEmailVerified: true,
    },
  });

  const seller1 = await prisma.user.upsert({
    where: { email: 'seller@vintageautos.com' },
    update: {},
    create: {
      email: 'seller@vintageautos.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Vintage',
      phone: '1234567890',
      status: UserStatus.ACTIVE,
      roleId: sellerRole.id,
      isEmailVerified: true,
      sellerProfile: {
        create: {
          companyName: 'Vintage Autos LLC',
          businessAddress: '123 Classic Drive, Detroit, MI',
          isVerified: true,
          kyc: {
            create: {
              documentType: KycDocType.BUSINESS_REGISTRATION,
              documentUrl: 'https://placehold.co/600x400?text=Business+Reg',
              idNumber: 'REG-123456',
              verificationStatus: KycStatus.APPROVED,
              verifiedAt: new Date(),
            },
          },
        },
      },
    },
  });

  // 3. Create Categories and Attributes
  console.log('Seeding categories and attributes...');
  for (const cat of seedCategories) {
    const upsertedCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        imageUrl: cat.imageUrl,
        isActive: cat.isActive,
        isFeatured: cat.isFeatured,
      },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        isActive: cat.isActive,
        isFeatured: cat.isFeatured,
      },
    });

    for (const attr of cat.attributes) {
      await prisma.categoryAttribute.upsert({
        where: { categoryId_name: { categoryId: upsertedCat.id, name: attr.name } },
        update: {
          type: attr.type,
          isRequired: attr.isRequired,
          options: attr.options ?? undefined,
        },
        create: {
          categoryId: upsertedCat.id,
          name: attr.name,
          type: attr.type,
          isRequired: attr.isRequired,
          options: attr.options ?? undefined,
        },
      });
    }
  }

  // Fetch the created category attributes for product creation compatibility
  const carCategory = await prisma.category.findUnique({
    where: { slug: 'classic-cars' },
    include: { attributes: true },
  });
  const motoCategory = await prisma.category.findUnique({
    where: { slug: 'motorcycles' },
    include: { attributes: true },
  });

  const carAttributes = carCategory ? carCategory.attributes : [];
  const motoAttributes = motoCategory ? motoCategory.attributes : [];

  // 3.4. Create Baskets
  console.log('Seeding baskets...');
  for (const basket of seedBaskets) {
    await prisma.basket.upsert({
      where: { slug: basket.slug },
      update: {
        name: basket.name,
        description: basket.description,
        image: basket.image,
        isActive: basket.isActive,
        isFeatured: basket.isFeatured,
      },
      create: basket,
    });
  }

  // 3.5. Create Settings
  console.log('Seeding settings...');
  for (const setting of seedSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {
        value: setting.value,
        description: setting.description,
        isPublic: setting.isPublic,
      },
      create: setting,
    });
  }

  // 4. Create Products & Auctions
  console.log('Creating products and auctions...');
  const sellerProfile = await prisma.sellerProfile.findUnique({ where: { userId: seller1.id } });

  if (sellerProfile) {
    const templates = [
      {
        slug: 'classic-cars',
        items: [
          { title: '1967 Ford Mustang Fastback', price: 65000, desc: 'A beautifully restored 1967 Ford Mustang Fastback in Highland Green. Original V8 engine.' },
          { title: '1973 Porsche 911 Carrera RS', price: 120000, desc: 'Original Carrera RS with matching numbers. Light restoration completed recently in Grand Prix White.' },
          { title: '1963 Chevrolet Corvette Split-Window', price: 95000, desc: 'Rare Split-Window coupe. 327/340hp V8, 4-speed manual transmission. Riverside Red over black.' }
        ]
      },
      {
        slug: 'vintage-cars',
        items: [
          { title: '1932 Ford Roadster Hot Rod', price: 55000, desc: 'Pristine steel-body hot rod. Flathead V8 engine, custom brown leather interior.' },
          { title: '1948 Chrysler Town & Country', price: 85000, desc: 'Historic wooden-body convertible. Fully restored ash and mahogany wood paneling.' },
          { title: '1955 Chevrolet Bel Air Nomad', price: 70000, desc: 'Classic two-door station wagon. 265 V8, two-tone turquoise and white paint.' }
        ]
      },
      {
        slug: 'luxury-watches',
        items: [
          { title: 'Rolex Submariner Ref 1680', price: 28000, desc: 'Vintage "Red Submariner" with single red line text. Mark IV dial, original folded link bracelet.' },
          { title: 'Patek Philippe Nautilus 5711', price: 115000, desc: 'Legendary Gérald Genta design. Blue-black textured dial, steel integrated bracelet.' },
          { title: 'Audemars Piguet Royal Oak', price: 85000, desc: 'Extra-Thin "Jumbo" Ref 15202ST. Petite Tapisserie blue dial, automatic movement.' }
        ]
      },
      {
        slug: 'gemstones',
        items: [
          { title: '3.5ct Colombian Emerald', price: 15000, desc: 'Certified natural emerald from Muzo mines. Deep forest green color, minor oil treatment.' },
          { title: '5.2ct Ceylon Blue Sapphire', price: 22000, desc: 'Unheated royal blue sapphire from Sri Lanka. Cushion cut, exceptional transparency.' },
          { title: '2.1ct Burma Ruby', price: 35000, desc: 'Vivid Pigeon Blood red Ruby from Mogok. Unheated, GIA certified collector stone.' }
        ]
      },
      {
        slug: 'motorcycles',
        items: [
          { title: '2023 Ducati Panigale V4 S', price: 32000, desc: 'Flagship Italian superbike. Desmosedici Stradale engine, Öhlins electronic suspension.' },
          { title: '1974 Ducati 750 Super Sport', price: 78000, desc: 'Ultra-rare round case desmo. Classic silver-blue fairing, historical collectors bike.' },
          { title: '1954 Vincent Black Shadow', price: 125000, desc: 'Legendary Series C. One of the fastest bikes of its era, pristine mechanical condition.' }
        ]
      },
      {
        slug: 'handicrafts',
        items: [
          { title: 'Persian Silk Isfahan Rug 9x12', price: 12500, desc: '100% natural silk hand-knotted rug. Exquisite central medallion design, 800+ KPSI.' },
          { title: '19th Century Carved Oak Chest', price: 3200, desc: 'French antique storage chest. Hand-carved mythological reliefs, original brass locks.' },
          { title: 'Murano Hand-Blown Chandelier', price: 5800, desc: 'Venetian art glass chandelier. 12 arms, multi-colored floral glass ornaments.' }
        ]
      },
      {
        slug: 'smart-appliances',
        items: [
          { title: 'La Marzocco Linea Mini', price: 5900, desc: 'Commercial-grade dual-boiler home espresso machine. Custom walnut wood accents.' },
          { title: 'Sub-Zero Pro 48 Refrigerator', price: 16500, desc: 'Dual refrigeration system, glass door. 100% stainless steel interior and exterior.' },
          { title: 'Miele Built-In Coffee System', price: 4800, desc: 'Plumbed water model. CupSensor automatic height adjuster, M Touch controls.' }
        ]
      }
    ];

    const seededBaskets = await prisma.basket.findMany();
    const randomImageUrls = [
      'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=compress&cs=tinysrgb&w=800',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=compress&cs=tinysrgb&w=800',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=compress&cs=tinysrgb&w=800',
      'https://images.unsplash.com/photo-1558981403-c5f91cbba527?auto=compress&cs=tinysrgb&w=800',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=compress&cs=tinysrgb&w=800'
    ];

    for (const temp of templates) {
      const category = await prisma.category.findUnique({
        where: { slug: temp.slug },
        include: { attributes: true }
      });

      if (!category) continue;

      for (let j = 0; j < temp.items.length; j++) {
        const item = temp.items[j];
        const sku = `${temp.slug.substring(0, 4).toUpperCase()}-${j + 1}-${Math.floor(Math.random() * 1000)}`;
        
        // 1. Select Basket sequentially
        const basket = seededBaskets[j % seededBaskets.length];
        
        // 2. Select Condition
        const conditions = [ItemCondition.NEW, ItemCondition.LIKE_NEW, ItemCondition.USED_GOOD];
        const condition = conditions[j % conditions.length];

        // 3. Check if product already exists
        const existingProduct = await prisma.product.findFirst({
          where: { title: item.title }
        });

        if (existingProduct) continue;

        // 4. Determine attribute values if category has them
        const attrValuesData = [];
        for (const attr of category.attributes) {
          if (attr.name === 'Make' || attr.name === 'Brand') {
            attrValuesData.push({ attributeId: attr.id, value: item.title.split(' ')[1] || 'Brand' });
          } else if (attr.name === 'Model' || attr.name === 'Type') {
            attrValuesData.push({ attributeId: attr.id, value: item.title.split(' ').slice(2).join(' ') || 'Model' });
          } else if (attr.name === 'Year') {
            attrValuesData.push({ attributeId: attr.id, value: item.title.match(/\d{4}/)?.[0] || '1970' });
          } else if (attr.name === 'Mileage') {
            attrValuesData.push({ attributeId: attr.id, value: '15000' });
          } else if (attr.name === 'Transmission') {
            attrValuesData.push({ attributeId: attr.id, value: 'Manual' });
          } else if (attr.name === 'Engine CC') {
            attrValuesData.push({ attributeId: attr.id, value: '998' });
          }
        }

        // 5. Create product
        const product = await prisma.product.create({
          data: {
            title: item.title,
            sku: sku,
            description: item.desc,
            condition: condition,
            basePrice: item.price,
            status: ProductStatus.IN_AUCTION,
            sellerId: sellerProfile.id,
            categoryId: category.id,
            basketId: basket.id,
            media: {
              create: [
                { url: randomImageUrls[j % randomImageUrls.length], isPrimary: true }
              ]
            },
            attributeValues: {
              create: attrValuesData
            }
          }
        });

        // 6. Select Auction Type — cycles: Bid Only → Buy Now Only → Bid & Buy
        const auctionTypes = [AuctionType.BID_ONLY, AuctionType.BUY_NOW_ONLY, AuctionType.BID_AND_BUY];
        const type = auctionTypes[j % auctionTypes.length];

        let startingBid = item.price * 0.8;
        let buyItNowPrice: number | null = null;

        if (type === AuctionType.BUY_NOW_ONLY) {
          startingBid = item.price;
          buyItNowPrice = item.price;
        } else if (type === AuctionType.BID_AND_BUY) {
          startingBid = item.price * 0.8;
          buyItNowPrice = item.price * 1.25;
        }

        const endTime = new Date();
        endTime.setDate(endTime.getDate() + (3 + (j % 5))); // 3 to 7 days from now

        // 7. Create Auction (no bids seeded)
        await prisma.auction.create({
          data: {
            productId: product.id,
            status: AuctionStatus.ACTIVE,
            startingBid: startingBid,
            buyItNowPrice: buyItNowPrice,
            bidIncrement: item.price > 10000 ? 500 : 100,
            startTime: new Date(),
            endTime: endTime,
            type: type,
            currentBid: startingBid,
            bidCount: 0
          }
        });
      }
    }
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
