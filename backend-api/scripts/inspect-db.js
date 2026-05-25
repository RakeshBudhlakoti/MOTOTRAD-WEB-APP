const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  console.log('🔍 Querying database for Categories and Baskets...');

  try {
    const categoriesCount = await prisma.category.count();
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } }
      }
    });

    console.log(`\n--- Categories (${categoriesCount}) ---`);
    categories.forEach(cat => {
      console.log(`- [${cat.isActive ? 'ACTIVE' : 'INACTIVE'}] Name: ${cat.name}, Slug: ${cat.slug}, Image: ${cat.imageUrl || 'NULL'}`);
    });

    const basketsCount = await prisma.basket.count();
    const baskets = await prisma.basket.findMany({
      include: {
        _count: { select: { products: true } }
      }
    });

    console.log(`\n--- Baskets (${basketsCount}) ---`);
    baskets.forEach(b => {
      console.log(`- [${b.isActive ? 'ACTIVE' : 'INACTIVE'}] Name: ${b.name}, Slug: ${b.slug}, Image: ${b.image || 'NULL'}, Products: ${b._count?.products || 0}`);
    });

  } catch (error) {
    console.error('❌ Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

inspect();
