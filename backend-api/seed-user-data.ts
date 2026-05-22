import { PrismaClient, BidStatus, OrderStatus, AuctionStatus } from '@prisma/client';

const prisma = new PrismaClient();
const userId = 'a1b8d1ed-b66f-4b4c-9734-2540f07cc85a';

async function main() {
  // 1. Get first 3 auctions
  const auctions = await prisma.auction.findMany({
    take: 3,
    include: { product: true },
  });

  if (auctions.length < 3) {
    console.log('Not enough auctions found. Please seed some products/auctions first.');
    return;
  }

  console.log('Found auctions:', auctions.map(a => a.id));

  // 2. Create Bids for first 2 auctions
  for (let i = 0; i < 2; i++) {
    const auction = auctions[i];
    const amount = Number(auction.currentBid) + 1000;
    
    await prisma.bid.create({
      data: {
        auctionId: auction.id,
        userId: userId,
        amount: amount,
        status: i === 0 ? 'WINNING' : 'OUTBID',
      },
    });
    
    // Update auction current bid
    await prisma.auction.update({
      where: { id: auction.id },
      data: { 
        currentBid: amount,
        highestBidderId: userId,
        bidCount: { increment: 1 }
      }
    });
    
    console.log(`Created bid for auction ${auction.id}`);
  }

  // 3. Create 1 Buy Now complete (Order) for the 3rd auction
  const orderAuction = auctions[2];
  
  // Mark auction as ended/sold if it wasn't already
  await prisma.auction.update({
    where: { id: orderAuction.id },
    data: { status: 'ENDED_SOLD' }
  });

  await prisma.order.create({
    data: {
      auctionId: orderAuction.id,
      buyerId: userId,
      sellerId: orderAuction.product.sellerId,
      orderNumber: `ORD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      totalAmount: orderAuction.buyItNowPrice || 5000,
      status: 'FULLY_PAID',
    },
  });

  console.log(`Created completed order for auction ${orderAuction.id}`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
