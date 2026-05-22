/**
 * Basket Seed Script
 * Usage: node seed_baskets.js
 *
 * This script creates 3 sample auction baskets directly in the database
 * via Prisma. Run from the backend-api directory.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASKETS = [
  {
    name: 'Auction in Miami',
    slug: 'auction-in-miami',
    description: 'Premium items from our flagship Miami auction event. Luxury, style, and heritage.',
    image: null,
    isActive: true,
  },
  {
    name: 'Auction in California',
    slug: 'auction-in-california',
    description: 'West Coast exclusive auction featuring rare motorcycles, vintage cars, and collectibles.',
    image: null,
    isActive: true,
  },
  {
    name: 'Auction in New York',
    slug: 'auction-in-new-york',
    description: 'High-profile New York auction with luxury watches, fine jewelry, and premium vehicles.',
    image: null,
    isActive: true,
  },
];

async function main() {
  console.log('🪣  Seeding auction baskets...\n');

  for (const basket of BASKETS) {
    // Upsert: creates if not exists, skips if slug already taken
    const existing = await prisma.basket.findUnique({ where: { slug: basket.slug } });

    if (existing) {
      console.log(`⚠️  Skipping "${basket.name}" — slug "${basket.slug}" already exists.`);
      continue;
    }

    const created = await prisma.basket.create({ data: basket });
    console.log(`✅  Created basket: "${created.name}" (ID: ${created.id})`);
  }

  console.log('\n🎉 Done! Baskets are ready.\n');
  console.log('You can now:');
  console.log('  1. View them at: Admin → Catalog → Baskets');
  console.log('  2. Assign them when adding/editing a Product');
  console.log('  3. They will appear on the homepage under "AUCTION BASKETS"\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding baskets:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
