import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await prisma.user.update({
    where: { email: 'wozeh@mailinator.com' },
    data: {
      verificationToken: token,
      verificationTokenExpires: expires,
    },
  });
  console.log(`Updated user ${user.email} with token: ${token}`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
