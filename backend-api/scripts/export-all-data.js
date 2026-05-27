const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const models = [
  'role', 'permission', 'rolePermission', 'user', 'sellerProfile', 'sellerKyc',
  'category', 'basket', 'categoryAttribute', 'product', 'productMedia',
  'productAttributeValue', 'auction', 'bid', 'auctionExtension', 'order',
  'payment', 'shipping', 'trackingEvent', 'notification', 'emailTemplate',
  'cmsPage', 'banner', 'page', 'faq', 'auditLog', 'report', 'setting',
  'watchlist', 'subscription', 'subscriptionPayment', 'contactInquiry'
];

async function run() {
  try {
    const dump = {};
    for (const model of models) {
      console.log(`Exporting ${model}...`);
      dump[model] = await prisma[model].findMany();
    }
    const dumpPath = path.resolve(__dirname, '../prisma/local-db-dump.json');
    fs.writeFileSync(dumpPath, JSON.stringify(dump, null, 2), 'utf8');
    console.log(`Successfully dumped all data to ${dumpPath}`);
  } catch (error) {
    console.error('Failed to export database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
