const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orderNumber = 'ORD-1779273540063-693';
  console.log("=== INSPECTING ORDER ===");
  const order = await prisma.order.findFirst({
    where: { orderNumber: orderNumber },
    include: {
      payments: true,
      auction: {
        include: {
          product: true
        }
      }
    }
  });
  console.log(JSON.stringify(order, null, 2));

  console.log("\n=== ALL RECENT ORDERS ===");
  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      auction: {
        include: {
          product: true
        }
      }
    }
  });
  console.log(recentOrders.map(o => ({
    orderNumber: o.orderNumber,
    baseAmount: o.baseAmount,
    commissionAmount: o.commissionAmount,
    commissionType: o.commissionType,
    commissionRate: o.commissionRate,
    finalAmount: o.finalAmount,
    productTitle: o.auction?.product?.title,
    productCommissionAmount: o.auction?.product?.commissionAmount,
    productCommissionType: o.auction?.product?.commissionType
  })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
