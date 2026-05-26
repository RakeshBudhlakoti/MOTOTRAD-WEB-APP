const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe('CREATE DATABASE mototrad_shadow');
    console.log('Database mototrad_shadow created successfully!');
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('42P04')) {
      console.log('Database mototrad_shadow already exists.');
    } else {
      console.error('Failed to create shadow database:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
