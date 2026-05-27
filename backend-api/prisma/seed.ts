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

  const buyer1 = await prisma.user.upsert({
    where: { email: 'buyer@gmail.com' },
    update: {},
    create: {
      email: 'buyer@gmail.com',
      passwordHash,
      firstName: 'Alice',
      lastName: 'Buyer',
      status: UserStatus.ACTIVE,
      roleId: buyerRole.id,
      isEmailVerified: true,
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
          { title: '1963 Chevrolet Corvette Split-Window', price: 95000, desc: 'Rare Split-Window coupe. 327/340hp V8, 4-speed manual transmission. Riverside Red over black.' },
          { title: '1971 Jaguar E-Type Series 3 V12', price: 80000, desc: 'Signal Red OTS. Beautiful V12 engine, manual transmission. Original interior and wire wheels.' },
          { title: '1969 Dodge Charger R/T', price: 85000, desc: 'Matching numbers 440 Magnum V8. Triple black color combination, pristine condition.' },
          { title: '1985 BMW M3 E30', price: 75000, desc: 'First-generation E30 M3 in Henna Red. Original S14 engine, pristine condition.' },
          { title: '1957 Mercedes-Benz 300SL Roadster', price: 350000, desc: 'Ultra-rare classic Roadster. Fully documented provenance and concours-level restoration.' },
          { title: '1970 Plymouth Superbird', price: 150000, desc: '440 Six-Pack V8, automatic transmission. TorRed exterior, legendary wing and nose cone.' },
          { title: '1974 Alfa Romeo GTV 2000', price: 45000, desc: 'Pristine Italian sports coupe. Alfa Red, 2.0L twin-cam engine, manual gearbox.' },
          { title: '1988 Ferrari Testarossa', price: 140000, desc: 'Iconic 80s supercar in Rosso Corsa. Flat-12 engine, gated 5-speed shifter. Only 18,000 miles.' }
        ]
      },
      {
        slug: 'vintage-cars',
        items: [
          { title: '1932 Ford Roadster Hot Rod', price: 55000, desc: 'Pristine steel-body hot rod. Flathead V8 engine, custom brown leather interior.' },
          { title: '1948 Chrysler Town & Country', price: 85000, desc: 'Historic wooden-body convertible. Fully restored ash and mahogany wood paneling.' },
          { title: '1955 Chevrolet Bel Air Nomad', price: 70000, desc: 'Classic two-door station wagon. 265 V8, two-tone turquoise and white paint.' },
          { title: '1928 Cadillac Series 341-A', price: 110000, desc: 'Fisher-bodied Town Sedan. Dual side-mount spares, original wood-spoke wheels.' },
          { title: '1937 Cord 812 Supercharged', price: 165000, desc: 'Advanced supercharged sedan. Front-wheel drive, wrap-around grill, hideaway headlights.' },
          { title: '1953 Hudson Hornet Club Coupe', price: 60000, desc: 'Twin-H Power inline-6 engine. Historic NASCAR heritage, step-down chassis design.' },
          { title: '1941 Lincoln Continental Coupe', price: 48000, desc: 'V12 engine, pristine dark blue paint. Classic spare tire mounted on trunk.' },
          { title: '1931 Duesenberg Model J', price: 850000, desc: 'Peerless American luxury coachwork. Straight-8 engine. Museum-quality preservation.' },
          { title: '1959 Cadillac Eldorado Biarritz', price: 180000, desc: 'Massive tail fins, dual bullet taillights. Tri-power 390 V8, bucket seat interior.' },
          { title: '1936 Auburn 852 Speedster', price: 220000, desc: 'Boattail Speedster. Supercharged engine, chrome external exhaust pipes.' }
        ]
      },
      {
        slug: 'luxury-watches',
        items: [
          { title: 'Rolex Submariner Ref 1680', price: 28000, desc: 'Vintage "Red Submariner" with single red line text. Mark IV dial, original folded link bracelet.' },
          { title: 'Patek Philippe Nautilus 5711', price: 115000, desc: 'Legendary Gérald Genta design. Blue-black textured dial, steel integrated bracelet.' },
          { title: 'Audemars Piguet Royal Oak', price: 85000, desc: 'Extra-Thin "Jumbo" Ref 15202ST. Petite Tapisserie blue dial, automatic movement.' },
          { title: 'Omega Speedmaster Moonwatch', price: 12000, desc: 'Vintage "Pre-Moon" 1969 Ref 145.022. Calibre 861, step dial, dot-over-ninety bezel.' },
          { title: 'Vacheron Constantin Overseas', price: 34000, desc: 'Chronograph steel model. Blue lacquer dial, quick-change bracelet system.' },
          { title: 'Rolex Daytona Ref 116500LN', price: 31000, desc: 'Cerachrom black ceramic bezel, white "Panda" dial. Oystersteel bracelet.' },
          { title: 'Richard Mille RM 011-FM', price: 185000, desc: 'Felipe Massa Flyback Chronograph. Tonneau titanium case, skeletonized dial.' },
          { title: 'Cartier Santos-Dumont Platinum', price: 18000, desc: 'Limited edition platinum case. Red ruby cabochon crown, manual winding.' },
          { title: 'Jaeger-LeCoultre Reverso', price: 11500, desc: 'Tribute Duoface. Front silver art deco dial, back black dial for second timezone.' },
          { title: 'A. Lange & Söhne Lange 1', price: 38000, desc: 'Asymmetric solid silver dial. Outsize date display, solid rose gold case.' }
        ]
      },
      {
        slug: 'gemstones',
        items: [
          { title: '3.5ct Colombian Emerald', price: 15000, desc: 'Certified natural emerald from Muzo mines. Deep forest green color, minor oil treatment.' },
          { title: '5.2ct Ceylon Blue Sapphire', price: 22000, desc: 'Unheated royal blue sapphire from Sri Lanka. Cushion cut, exceptional transparency.' },
          { title: '2.1ct Burma Ruby', price: 35000, desc: 'Vivid Pigeon Blood red Ruby from Mogok. Unheated, GIA certified collector stone.' },
          { title: '8.4ct Natural Tanzanite', price: 6500, desc: 'Trillion cut tanzanite. Deep violet-blue color with strong red flash pleochroism.' },
          { title: '1.5ct Pink Diamond', price: 95000, desc: 'GIA certified Fancy Intense Pink diamond. Radiant cut, VS2 clarity, investment grade.' },
          { title: '12.5ct Australian Black Opal', price: 18000, desc: 'Lightning Ridge solid black opal. Full spectrum fire, red-green dominant pinfire pattern.' },
          { title: '4.8ct Paraiba Tourmaline', price: 45000, desc: 'Neon electric blue tourmaline from Mozambique. Heated, oval cut, dazzling brilliance.' },
          { title: '15mm South Sea Pearl Strand', price: 14000, desc: 'Golden South Sea cultured pearls. High luster, round shapes, 18K yellow gold clasp.' },
          { title: '6.1ct Imperial Topaz', price: 8000, desc: 'Natural golden-orange topaz with peach overtones. Custom scissor cut from Ouro Preto.' },
          { title: '10.2ct Tsavorite Garnet', price: 11000, desc: 'Deep vibrant green grossular garnet from Kenya. Oval cut, excellent eye-clean clarity.' }
        ]
      },
      {
        slug: 'motorcycles',
        items: [
          { title: '2023 Ducati Panigale V4 S', price: 32000, desc: 'Flagship Italian superbike. Desmosedici Stradale engine, Öhlins electronic suspension.' },
          { title: '1974 Ducati 750 Super Sport', price: 78000, desc: 'Ultra-rare round case desmo. Classic silver-blue fairing, historical collectors bike.' },
          { title: '1954 Vincent Black Shadow', price: 125000, desc: 'Legendary Series C. One of the fastest bikes of its era, pristine mechanical condition.' },
          { title: '1969 Triumph Bonneville T120R', price: 14000, desc: 'Classic parallel-twin British motorcycle. Fully restored Tangerine/Olympic Flame paint.' },
          { title: '2022 HD CVO Road Glide', price: 42000, desc: 'Custom Vehicle Operations bagger. 117ci engine, premium paint and audio system.' },
          { title: '1972 Kawasaki H2 Mach IV 750', price: 19000, desc: 'Classic 2-stroke triple. Restored to stock specifications, original candy blue paint.' },
          { title: '2021 BMW R18 Custom Bobber', price: 24000, desc: 'Custom builder series. 1802cc boxer engine, solo seat, custom blacked-out exhausts.' },
          { title: '1982 Honda CBX1000 Six', price: 16500, desc: '24-valve inline-six cylinder superbike. Original exhausts, runs and rides beautifully.' },
          { title: '2023 MV Agusta Brutale 1000', price: 36000, desc: 'Ultra-premium naked bike. 208 horsepower, titanium components, carbon fiber fairings.' },
          { title: '1939 Indian Four Model 439', price: 85000, desc: 'Classic four-cylinder American motorcycle. Beautiful skirted fenders, historic red paint.' }
        ]
      },
      {
        slug: 'handicrafts',
        items: [
          { title: 'Persian Silk Isfahan Rug 9x12', price: 12500, desc: '100% natural silk hand-knotted rug. Exquisite central medallion design, 800+ KPSI.' },
          { title: '19th Century Carved Oak Chest', price: 3200, desc: 'French antique storage chest. Hand-carved mythological reliefs, original brass locks.' },
          { title: 'Murano Hand-Blown Chandelier', price: 5800, desc: 'Venetian art glass chandelier. 12 arms, multi-colored floral glass ornaments.' },
          { title: 'Meiji Period Bronze Eagle', price: 9500, desc: 'Japanese antique sculpture. Life-sized wingspan detail, signed by the master artist.' },
          { title: 'Damascus Steel Collector Sword', price: 2200, desc: 'Custom hand-forged 32-inch sword. 512 layers of folded steel, mammoth ivory handle.' },
          { title: 'French Hand-Painted Porcelain Vase', price: 4500, desc: 'Sèvres style cobalt blue urn. Hand-painted romantic garden scenes, gold leaf mounts.' },
          { title: 'Balinese Carved Teak Bench', price: 1800, desc: 'Solid teak garden bench. Intricate floral and wildlife hand-carvings on backrest.' },
          { title: 'Tibetan Singing Bowl Set', price: 1200, desc: 'Set of 7 antique hand-hammered bronze singing bowls, calibrated for musical chakras.' },
          { title: 'Moroccan Woven Wool Berber rug', price: 2400, desc: 'Authentic Beni Ourain tribal rug. Shag wool, traditional black diamond pattern.' },
          { title: 'Indian Inlaid Marble Jewelry Box', price: 900, desc: 'White Makrana marble box, hand-inlaid with lapis lazuli, malachite, and carnelian.' }
        ]
      },
      {
        slug: 'electrical-appliances',
        items: [
          { title: 'La Marzocco Linea Mini', price: 5900, desc: 'Commercial-grade dual-boiler home espresso machine. Custom walnut wood accents.' },
          { title: 'Sub-Zero Pro 48 Refrigerator', price: 16500, desc: 'Dual refrigeration system, glass door. 100% stainless steel interior and exterior.' },
          { title: 'Miele Built-In Coffee System', price: 4800, desc: 'Plumbed water model. CupSensor automatic height adjuster, M Touch controls.' },
          { title: 'Thermomix TM6 Cooker Bundle', price: 1500, desc: 'All-in-one smart kitchen appliance. Built-in WiFi, guided cooking touchscreen.' },
          { title: 'Dyson 360 Vis Nav Robot', price: 1200, desc: 'High suction robotic vacuum cleaner. Piezo sensor particle detection.' },
          { title: 'Gaggenau Combi-Steam Oven', price: 8200, desc: '400 Series built-in steam oven. Plumbed water supply, automatic cleaning.' },
          { title: 'B&O Beosound Theatre Soundbar', price: 9500, desc: 'High-end Dolby Atmos soundbar. Solid oak wood fret, aluminum frame.' },
          { title: 'Wine Cellar 300-Bottle Cabinet', price: 3800, desc: 'Dual-zone cooling cabinet. UV-protected glass, rolling sapele wood shelves.' },
          { title: 'Smeg D&G Retro Toaster', price: 850, desc: '"Sicily is my Love" limited edition. Hand-decorated Italian folk art patterns.' },
          { title: 'Breville Oracle Touch Espresso', price: 2800, desc: 'Automatic grinding, tamping, and milk texturing. Color touchscreen control.' }
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

        // 6. Select Auction Type
        const auctionTypes = [AuctionType.BID_ONLY, AuctionType.BUY_NOW_ONLY, AuctionType.BID_AND_BUY];
        const type = auctionTypes[j % auctionTypes.length];

        let startingBid = item.price * 0.8;
        let buyItNowPrice = null;

        if (type === AuctionType.BUY_NOW_ONLY) {
          startingBid = item.price;
          buyItNowPrice = item.price;
        } else if (type === AuctionType.BID_AND_BUY) {
          startingBid = item.price * 0.8;
          buyItNowPrice = item.price * 1.25;
        }

        const endTime = new Date();
        endTime.setDate(endTime.getDate() + (3 + (j % 5))); // 3 to 7 days end time

        // 7. Create Auction
        const auction = await prisma.auction.create({
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

        // 8. Add a bid on some auctions to show activity
        if (type !== AuctionType.BUY_NOW_ONLY && j % 2 === 0) {
          const bidAmount = startingBid + (item.price > 10000 ? 500 : 100);
          await prisma.bid.create({
            data: {
              userId: buyer1.id,
              auctionId: auction.id,
              amount: bidAmount,
              status: 'VALID',
              isHighestBid: true
            }
          });
          await prisma.auction.update({
            where: { id: auction.id },
            data: {
              currentBid: bidAmount,
              bidCount: 1,
              highestBidderId: buyer1.id
            }
          });
        }
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
