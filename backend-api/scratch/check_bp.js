const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findUnique({
    where: { id: '8ab79143-eefa-4762-8ac6-17434455ef47' }
  });
  console.log("=== PRODUCT B.P SETTINGS ===");
  console.log(JSON.stringify(product, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
