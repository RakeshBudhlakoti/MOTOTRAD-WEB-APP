import { PrismaClient, UserStatus, ProductStatus, AuctionStatus, ItemCondition, MediaType } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { name: 'Vintage Cars', slug: 'vintage-cars', description: 'Classic and vintage automobiles.' },
  { name: 'Luxury Watches', slug: 'luxury-watches', description: 'Premium timepieces from world-renowned brands.' },
  { name: 'Gemstones', slug: 'gemstones', description: 'Rare and precious gemstones.' },
  { name: 'Motorcycles', slug: 'motorcycles', description: 'Classic and modern high-performance motorcycles.' },
  { name: 'Fine Jewelry', slug: 'fine-jewelry', description: 'Exquisite jewelry pieces and collections.' },
  { name: 'Real Estate', slug: 'real-estate', description: 'Premium residential and commercial properties.' },
];

const images = {
  'vintage-cars': [
    'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'luxury-watches': [
    'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2113994/pexels-photo-2113994.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'gemstones': [
    'https://images.pexels.com/photos/1123262/pexels-photo-1123262.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1458867/pexels-photo-1458867.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'motorcycles': [
    'https://images.pexels.com/photos/2116489/pexels-photo-2116489.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2626661/pexels-photo-2626661.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'fine-jewelry': [
    'https://images.pexels.com/photos/2850719/pexels-photo-2850719.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/265906/pexels-photo-265906.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'real-estate': [
    'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800',
  ]
};

async function main() {
  console.log('--- Starting Seeding ---');

  // 1. Create or Get Admin Role
  let adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: { name: 'ADMIN', description: 'System Administrator', isSystem: true }
    });
  }

  // 2. Create System User
  let systemUser = await prisma.user.findFirst({ where: { email: 'admin@mototrad.com' } });
  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        email: 'admin@mototrad.com',
        passwordHash: '$2b$10$Ep9pZ.j7Xm1m5WJ7L8R5Z.f7Xm1m5WJ7L8R5Z.f7Xm1m5WJ7L8R5Z.', // dummy
        firstName: 'System',
        lastName: 'Admin',
        status: UserStatus.ACTIVE,
        roleId: adminRole.id,
        isEmailVerified: true
      }
    });
  }

  // 3. Create Seller Profile
  let sellerProfile = await prisma.sellerProfile.findFirst({ where: { userId: systemUser.id } });
  if (!sellerProfile) {
    sellerProfile = await prisma.sellerProfile.create({
      data: {
        userId: systemUser.id,
        companyName: 'Mototrad Global',
        isVerified: true
      }
    });
  }

  // 4. Create Categories and Products
  for (const catData of categories) {
    console.log(`Processing Category: ${catData.name}`);
    let category = await prisma.category.findUnique({ where: { slug: catData.slug } });
    if (!category) {
      category = await prisma.category.create({ data: catData });
    }

    // Create 10 Products for this category
    for (let i = 1; i <= 10; i++) {
      const title = `${catData.name} Item #${i}`;
      const sku = `${catData.slug}-${i}-${Date.now().toString().slice(-4)}`;
      
      const product = await prisma.product.create({
        data: {
          title,
          sku,
          description: `This is a premium ${catData.name} listed exclusively on Mototrad. Experience the highest level of craftsmanship and heritage.`,
          condition: ItemCondition.LIKE_NEW,
          status: ProductStatus.IN_AUCTION,
          sellerId: sellerProfile.id,
          categoryId: category.id,
          basePrice: 5000 + (i * 1000)
        }
      });

      // Add Media
      const catImages = (images as any)[catData.slug] || images['vintage-cars'];
      const imageUrl = catImages[i % catImages.length];
      
      await prisma.productMedia.create({
        data: {
          productId: product.id,
          url: imageUrl,
          mediaType: MediaType.IMAGE,
          isPrimary: true
        }
      });

      // Add Auction
      const startTime = new Date();
      const endTime = new Date();
      endTime.setDate(endTime.getDate() + 7); // 7 days from now

      await prisma.auction.create({
        data: {
          productId: product.id,
          status: AuctionStatus.ACTIVE,
          startingBid: 5000 + (i * 1000),
          bidIncrement: 100,
          startTime,
          endTime,
          currentBid: 5000 + (i * 1000),
          bidCount: Math.floor(Math.random() * 20)
        }
      });
    }
  }

  console.log('--- Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
