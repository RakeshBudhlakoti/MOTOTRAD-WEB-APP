const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.product.update({
    where: { id: '8ab79143-eefa-4762-8ac6-17434455ef47' },
    data: { commissionType: 'FLAT' } // Set to FLAT so the $10 commission is calculated and displayed
  });
  console.log("=== FIX COMPLETED ===");
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
