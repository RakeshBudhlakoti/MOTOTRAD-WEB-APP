import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const userId = '0d813419-023f-40b9-9b69-a8d3766baea7';

async function main() {
  console.log('Starting data injection for user:', userId);

  // 1. Add Bids
  const bidAuctions = [
    { id: '16db1209-a51b-47ce-98b2-d535c135e2ac', amount: 117000 },
    { id: '0e249c9d-74a2-42c0-bf70-9cffac8c2137', amount: 127000 },
    { id: 'bfb47f95-8d45-405e-af1f-e5154945642f', amount: 7000 },
  ];

  for (const bid of bidAuctions) {
    await prisma.bid.create({
      data: {
        auctionId: bid.id,
        userId: userId,
        amount: bid.amount,
        status: 'VALID'
      }
    });
    
    await prisma.auction.update({
      where: { id: bid.id },
      data: {
        currentBid: bid.amount,
        highestBidderId: userId,
        bidCount: { increment: 1 }
      }
    });
    console.log(`Added bid for auction ${bid.id}`);
  }

  // 2. Add "Buy Now" Order
  const orderAuctionId = 'f636cef3-963d-483e-8997-8b68ae22b9b2';
  const auction = await prisma.auction.findUnique({
    where: { id: orderAuctionId },
    include: { product: true }
  });

  if (auction) {
    const orderAmount = 850;
    const orderNumber = `MT-${Math.floor(100000 + Math.random() * 900000)}`;

    await prisma.order.create({
      data: {
        auctionId: orderAuctionId,
        buyerId: userId,
        sellerId: auction.product.sellerId,
        orderNumber: orderNumber,
        totalAmount: orderAmount,
        status: 'FULLY_PAID'
      }
    });

    await prisma.auction.update({
      where: { id: orderAuctionId },
      data: {
        status: 'ENDED_SOLD',
        highestBidderId: userId,
        currentBid: orderAmount
      }
    });
    console.log(`Created order ${orderNumber} for auction ${orderAuctionId}`);
  }

  console.log('Data injection completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
