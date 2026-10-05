const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.shop.updateMany({ data: { plan: 'free' } });
  await prisma.subscription.updateMany({ data: { status: 'cancelled' } });
  console.log('Reset all shops to free plan.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
