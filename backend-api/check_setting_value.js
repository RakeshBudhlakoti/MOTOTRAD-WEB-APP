const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const setting = await prisma.setting.findUnique({
    where: { key: 'upfront_payment_percentage' }
  });
  console.log("=== DB RECORD FOR upfront_payment_percentage ===");
  console.log(setting);
}

main().catch(console.error).finally(() => prisma.$disconnect());
