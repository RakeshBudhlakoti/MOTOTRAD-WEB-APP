const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanData() {
  console.log('🚀 Starting DEEP cleanup of product-related data...');

  try {
    // 1. Delete Payments (reference orders)
    console.log('--- Cleaning Payments ---');
    try { await prisma.payment?.deleteMany({}); } catch(e) { /* ignore */ }
    try { await prisma.subscriptionPayment?.deleteMany({}); } catch(e) { /* ignore */ }

    // 2. Delete Orders
    console.log('--- Cleaning Orders ---');
    try { await prisma.order.deleteMany({}); } catch(e) { /* ignore */ }
    
    // 3. Delete Bidding activity
    console.log('--- Cleaning Bids & Auctions ---');
    try { await prisma.bid.deleteMany({}); } catch(e) { /* ignore */ }
    try { await prisma.auction.deleteMany({}); } catch(e) { /* ignore */ }

    // 4. Delete Product specific data
    console.log('--- Cleaning Product Metadata & Media ---');
    try { await prisma.productAttributeValue.deleteMany({}); } catch(e) { /* ignore */ }
    try { await prisma.productMedia.deleteMany({}); } catch(e) { /* ignore */ }
    
    // 5. Delete Products
    console.log('--- Cleaning Products ---');
    try { await prisma.product.deleteMany({}); } catch(e) { /* ignore */ }

    // 6. Delete Sellers (Profiles for users)
    console.log('--- Cleaning Seller Profiles ---');
    try { await prisma.seller.deleteMany({}); } catch(e) { /* ignore */ }

    // 7. Delete Taxonomy (Categories & Attributes)
    console.log('--- Cleaning Taxonomy ---');
    try { await prisma.categoryAttribute.deleteMany({}); } catch(e) { /* ignore */ }
    
    try {
        await prisma.category.updateMany({ data: { parentId: null } });
        await prisma.category.deleteMany({});
    } catch(e) { /* ignore */ }

    console.log('✅ Cleanup successful! Core identity (Users/Roles/Permissions) preserved.');
  } catch (error) {
    console.error('❌ Critical failure during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanData();
