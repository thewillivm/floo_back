const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const purchases = await prisma.purchase.findMany({
    include: {
      post: { include: { creator: true } },
      buyer: true
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  
  console.log('Recent Purchases:');
  purchases.forEach(p => {
    console.log(`- Amount: ${p.amount}, Buyer: ${p.buyer.username}, Creator: ${p.post.creator.username}, Creator Email: ${p.post.creator.email}`);
  });
  
  await prisma.$disconnect();
}

check();
