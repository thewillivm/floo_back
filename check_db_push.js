const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const subscriptions = await prisma.pushSubscription.findMany({
    include: { user: true }
  });
  console.log('--- Push Subscriptions ---');
  console.log(JSON.stringify(subscriptions, null, 2));
  
  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true }
  });
  console.log('--- Users ---');
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
