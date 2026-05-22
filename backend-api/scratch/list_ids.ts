import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const auctions = await prisma.auction.findMany({
    take: 5,
    select: { id: true, product: { select: { title: true } } }
  });
  console.log('--- Seeded Auctions ---');
  auctions.forEach(a => console.log(`${a.product.title}: http://localhost:3003/auctions/${a.id}`));
}

main().finally(() => prisma.$disconnect());
