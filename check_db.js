const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { followers: true, following: true }
        }
      }
    });
    console.log('--- USERS ---');
    console.log(JSON.stringify(users, null, 2));

    const follows = await prisma.follow.findMany();
    console.log('\n--- FOLLOWS ---');
    console.log(JSON.stringify(follows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
