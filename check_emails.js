const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true }
  });
  console.log('Users in DB:');
  console.table(users);
  await prisma.$disconnect();
}

check();
