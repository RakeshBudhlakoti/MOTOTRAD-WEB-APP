import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    where: { isProMember: true },
    select: { id: true, email: true, isProMember: true, membershipStatus: true }
  });

  const payments = await prisma.subscriptionPayment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log('Pro Users:', JSON.stringify(users, null, 2));
  console.log('Recent Payments:', JSON.stringify(payments, null, 2));
  console.log('Recent Subscriptions:', JSON.stringify(subscriptions, null, 2));
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
