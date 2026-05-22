import { PrismaClient, AuctionType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const sellerId = 'eb0c2940-e7ab-481f-9ebf-62a3e29b5833';
const categoryId = '2c275824-cfdc-4137-887f-23c82f4d2df0';

async function main() {
  console.log('Adding 6 new products with different auction types...');

  const products = [
    { title: '2023 Ducati Panigale V4 R', type: 'BID_ONLY' as AuctionType, price: 45000, img: 'https://images.pexels.com/photos/2626671/pexels-photo-2626671.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { title: 'Vintage Rolex Submariner 1968', type: 'BID_ONLY' as AuctionType, price: 18000, img: 'https://images.pexels.com/photos/280250/pexels-photo-280250.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { title: 'Tesla Model S Plaid - Carbon Edition', type: 'BUY_NOW_ONLY' as AuctionType, price: 110000, img: 'https://images.pexels.com/photos/110844/pexels-photo-110844.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { title: 'Hasselblad H6D-100c Digital Back', type: 'BUY_NOW_ONLY' as AuctionType, price: 25000, img: 'https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { title: 'Limited Edition 2024 Porsche 911 GT3', type: 'BID_AND_BUY' as AuctionType, price: 195000, img: 'https://images.pexels.com/photos/3729464/pexels-photo-3729464.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { title: 'Rare 1954 Fender Stratocaster', type: 'BID_AND_BUY' as AuctionType, price: 35000, img: 'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=800' },
  ];

  for (const p of products) {
    const sku = `SKU-${Math.random().toString(36).substring(7).toUpperCase()}`;
    const product = await prisma.product.create({
      data: {
        sellerId,
        categoryId,
        title: p.title,
        sku,
        description: `Premium ${p.title} available exclusively on Mototrad. Certified quality and authentic heritage.`,
        condition: 'LIKE_NEW',
        status: 'IN_AUCTION',
        media: {
          create: {
            url: p.img,
            isPrimary: true,
          }
        }
      }
    });

    await prisma.auction.create({
      data: {
        productId: product.id,
        status: 'ACTIVE',
        type: p.type,
        startingBid: p.price,
        currentBid: p.price,
        bidIncrement: 500,
        startTime: new Date(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        buyItNowPrice: p.type !== 'BID_ONLY' ? p.price * 1.2 : null,
      }
    });

    console.log(`Added ${p.title} as ${p.type}`);
  }

  console.log('Success! 6 products added.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
