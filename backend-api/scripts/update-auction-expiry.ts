import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const auctionId = '2104d777-4ca2-469c-9f0a-4673c1ad7c8b';
  
  // 5 minutes from now
  const newEndTime = new Date(Date.now() + 5 * 60 * 1000);
  
  console.log(`Updating auction ${auctionId} to expire at ${newEndTime.toISOString()}`);
  
  const updated = await prisma.auction.update({
    where: { id: auctionId },
    data: {
      endTime: newEndTime,
      status: 'ACTIVE'
    }
  });
  
  console.log('Auction updated successfully:', updated);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
