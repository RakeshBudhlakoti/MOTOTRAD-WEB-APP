import { PrismaClient, UserStatus, KycStatus, KycDocType, ItemCondition, ProductStatus, AuctionStatus, AttrType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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

  // 3. Create Categories
  console.log('Creating categories...');
  const carCategory = await prisma.category.upsert({
    where: { slug: 'classic-cars' },
    update: {},
    create: {
      name: 'Classic Cars',
      slug: 'classic-cars',
      description: 'Vintage and classic automobiles',
    },
  });

  const carAttributesData = [
    { name: 'Make', type: AttrType.STRING, isRequired: true },
    { name: 'Model', type: AttrType.STRING, isRequired: true },
    { name: 'Year', type: AttrType.NUMBER, isRequired: true },
    { name: 'Mileage', type: AttrType.NUMBER, isRequired: true },
    { name: 'Transmission', type: AttrType.ENUM, options: ['Manual', 'Automatic'] },
  ];

  const carAttributes = [];
  for (const attr of carAttributesData) {
    const upserted = await prisma.categoryAttribute.upsert({
      where: { categoryId_name: { categoryId: carCategory.id, name: attr.name } },
      update: {},
      create: {
        categoryId: carCategory.id,
        name: attr.name,
        type: attr.type,
        isRequired: attr.isRequired,
        options: attr.options,
      },
    });
    carAttributes.push(upserted);
  }

  (carCategory as any).attributes = carAttributes;

  const motoCategory = await prisma.category.upsert({
    where: { slug: 'motorcycles' },
    update: {},
    create: {
      name: 'Motorcycles',
      slug: 'motorcycles',
      description: 'Two-wheeled machines',
    },
  });

  const motoAttributesData = [
    { name: 'Brand', type: AttrType.STRING, isRequired: true },
    { name: 'Engine CC', type: AttrType.NUMBER, isRequired: true },
    { name: 'Type', type: AttrType.ENUM, options: ['Sport', 'Cruiser', 'Dirt'] },
  ];

  const motoAttributes = [];
  for (const attr of motoAttributesData) {
    const upserted = await prisma.categoryAttribute.upsert({
      where: { categoryId_name: { categoryId: motoCategory.id, name: attr.name } },
      update: {},
      create: {
        categoryId: motoCategory.id,
        name: attr.name,
        type: attr.type,
        isRequired: attr.isRequired,
        options: attr.options,
      },
    });
    motoAttributes.push(upserted);
  }

  (motoCategory as any).attributes = motoAttributes;

  // 3.5. Create Settings
  console.log('Seeding settings...');
  await prisma.setting.upsert({
    where: { key: 'ALLOW_BUY_NOW_AFTER_BIDS' },
    update: {},
    create: {
      key: 'ALLOW_BUY_NOW_AFTER_BIDS',
      value: 'false',
      isPublic: true,
      description: 'Allow Buy Now After Bids',
    },
  });

  // 4. Create Products & Auctions
  console.log('Creating products and auctions...');
  const sellerProfile = await prisma.sellerProfile.findUnique({ where: { userId: seller1.id } });

  if (sellerProfile) {
    // Product 1: 1967 Mustang (Conditional Create)
    const existingMustang = await prisma.product.findFirst({ where: { sku: 'FORD-MUST-67-001' } });
    if (!existingMustang) {
      const mustang = await prisma.product.create({
        data: {
          title: '1967 Ford Mustang Fastback',
          sku: 'FORD-MUST-67-001',
          description: 'A beautifully restored 1967 Ford Mustang Fastback in Highland Green. Original V8 engine.',
          condition: ItemCondition.LIKE_NEW,
          basePrice: 45000,
          status: ProductStatus.IN_AUCTION,
          sellerId: sellerProfile.id,
          categoryId: carCategory.id,
          buyNowDisabled: true,
          buyNowDisabledReason: 'ACTIVE_BIDDING',
          media: {
            create: [
              { url: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd', isPrimary: true },
              { url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d', isPrimary: false },
            ],
          },
          attributeValues: {
            create: [
              { attributeId: carAttributes.find(a => a.name === 'Make')!.id, value: 'Ford' },
              { attributeId: carAttributes.find(a => a.name === 'Model')!.id, value: 'Mustang' },
              { attributeId: carAttributes.find(a => a.name === 'Year')!.id, value: '1967' },
              { attributeId: carAttributes.find(a => a.name === 'Mileage')!.id, value: '12000' },
              { attributeId: carAttributes.find(a => a.name === 'Transmission')!.id, value: 'Manual' },
            ],
          },
        },
      });

      await prisma.auction.create({
        data: {
          productId: mustang.id,
          status: AuctionStatus.ACTIVE,
          startingBid: 40000,
          reservePrice: 55000,
          buyItNowPrice: 75000,
          bidIncrement: 500,
          startTime: new Date(),
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          currentBid: 40500,
          bidCount: 1,
          bids: {
            create: {
              userId: buyer1.id,
              amount: 40500,
              status: 'VALID',
            },
          },
        },
      });
    }

    // Product 2: Ducati Panigale (Conditional Create)
    const existingDucati = await prisma.product.findFirst({ where: { sku: 'DUC-PAN-V4S-23' } });
    if (!existingDucati) {
      const ducati = await prisma.product.create({
        data: {
          title: '2023 Ducati Panigale V4 S',
          sku: 'DUC-PAN-V4S-23',
          description: 'Exquisite performance. The latest V4 S with racing exhaust and carbon fiber parts.',
          condition: ItemCondition.NEW,
          basePrice: 32000,
          status: ProductStatus.IN_AUCTION,
          sellerId: sellerProfile.id,
          categoryId: motoCategory.id,
          media: {
            create: [
              { url: 'https://images.unsplash.com/photo-1558981403-c5f91cbba527', isPrimary: true },
            ],
          },
          attributeValues: {
            create: [
              { attributeId: motoAttributes.find(a => a.name === 'Brand')!.id, value: 'Ducati' },
              { attributeId: motoAttributes.find(a => a.name === 'Engine CC')!.id, value: '1103' },
              { attributeId: motoAttributes.find(a => a.name === 'Type')!.id, value: 'Sport' },
            ],
          },
        },
      });

      await prisma.auction.create({
        data: {
          productId: ducati.id,
          status: AuctionStatus.ACTIVE,
          startingBid: 30000,
          bidIncrement: 200,
          startTime: new Date(),
          endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        },
      });
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
