import { PrismaClient, ItemCondition, ProductStatus, AuctionStatus, MediaType } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { name: 'Vintage Cars', slug: 'vintage-cars', description: 'Classic and rare automobiles', image: 'https://images.pexels.com/photos/1051073/pexels-photo-1051073.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name: 'Luxury Watches', slug: 'luxury-watches', description: 'Premium timepieces', image: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name: 'Gemstones', slug: 'gemstones', description: 'Rare and precious stones', image: 'https://images.pexels.com/photos/2733918/pexels-photo-2733918.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name: 'Motorcycles', slug: 'motorcycles', description: 'Classic and modern bikes', image: 'https://images.pexels.com/photos/2626671/pexels-photo-2626671.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name: 'Handicrafts', slug: 'handicrafts', description: 'Artisan made goods', image: 'https://images.pexels.com/photos/2162938/pexels-photo-2162938.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name: 'Electrical Appliances', slug: 'electrical-appliances', description: 'Modern and vintage electronics', image: 'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=800' }
];

async function main() {
  console.log('Cleaning up existing data...');
  
  // Clear order related data first
  await prisma.trackingEvent.deleteMany();
  await prisma.shipping.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  
  // Clear auction related data
  await prisma.watchlist.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.auctionExtension.deleteMany();
  await prisma.auction.deleteMany();
  
  // Clear product related data
  await prisma.productMedia.deleteMany();
  await prisma.productAttributeValue.deleteMany();
  await prisma.product.deleteMany();

  console.log('Fetching/Creating categories...');
  const catMap: Record<string, any> = {};
  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: { name: cat.name, slug: cat.slug, description: cat.description }
    });
    catMap[cat.slug] = category;
  }

  // Get a seller profile to assign products to
  const seller = await prisma.sellerProfile.findFirst();
  if (!seller) {
    console.error('No seller profile found. Please run initial seed first.');
    return;
  }

  console.log('Seeding 2 products per category...');

  const productData = [
    // Vintage Cars
    { title: '1967 Ford Mustang Fastback', category: 'vintage-cars', price: 125000, img: 'https://images.pexels.com/photos/1051073/pexels-photo-1051073.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { title: '1954 Mercedes-Benz 300 SL', category: 'vintage-cars', price: 1450000, img: 'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg?auto=compress&cs=tinysrgb&w=800' },
    
    // Luxury Watches
    { title: 'Rolex Daytona Platinum', category: 'luxury-watches', price: 85000, img: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { title: 'Patek Philippe Nautilus', category: 'luxury-watches', price: 115000, img: 'https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=800' },
    
    // Gemstones
    { title: 'Rare Blue Sapphire 5ct', category: 'gemstones', price: 25000, img: 'https://images.pexels.com/photos/2733918/pexels-photo-2733918.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { title: 'Untreated Emerald Cut Diamond', category: 'gemstones', price: 45000, img: 'https://images.pexels.com/photos/1458867/pexels-photo-1458867.jpeg?auto=compress&cs=tinysrgb&w=800' },
    
    // Motorcycles
    { title: 'Ducati Superleggera V4', category: 'motorcycles', price: 95000, img: 'https://images.pexels.com/photos/2626671/pexels-photo-2626671.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { title: 'Vintage Harley Davidson 1948', category: 'motorcycles', price: 42000, img: 'https://images.pexels.com/photos/2116491/pexels-photo-2116491.jpeg?auto=compress&cs=tinysrgb&w=800' },
    
    // Handicrafts
    { title: 'Hand-Carved Walnut Desk', category: 'handicrafts', price: 4500, img: 'https://images.pexels.com/photos/2162938/pexels-photo-2162938.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { title: 'Persian Silk Rug - Tabriz', category: 'handicrafts', price: 12000, img: 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=800' },
    
    // Electrical Appliances
    { title: 'Vintage McIntosh Tube Amp', category: 'electrical-appliances', price: 6500, img: 'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { title: 'High-End Dyson Air Purifier', category: 'electrical-appliances', price: 800, img: 'https://images.pexels.com/photos/4009402/pexels-photo-4009402.jpeg?auto=compress&cs=tinysrgb&w=800' },
  ];

  for (const p of productData) {
    const product = await prisma.product.create({
      data: {
        sellerId: seller.id,
        categoryId: catMap[p.category].id,
        title: p.title,
        sku: `SKU-${Math.random().toString(36).substring(7).toUpperCase()}`,
        description: `This is a premium ${p.title} listed exclusively on Mototrad. Experience the highest level of craftsmanship and heritage.`,
        condition: ItemCondition.LIKE_NEW,
        status: ProductStatus.IN_AUCTION,
        media: {
          create: {
            url: p.img,
            isPrimary: true
          }
        },
        auctions: {
          create: {
            status: AuctionStatus.ACTIVE,
            startingBid: p.price,
            currentBid: p.price,
            bidIncrement: 500,
            startTime: new Date(),
            endTime: new Date(Date.now() + (Math.floor(Math.random() * 7) + 1) * 24 * 60 * 60 * 1000 + (Math.floor(Math.random() * 12) * 60 * 60 * 1000)), // 1-7 days + random hours
          }
        }
      }
    });
    console.log(`Created product: ${product.title}`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
