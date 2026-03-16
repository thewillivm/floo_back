const prisma = require('../config/prisma');

const getCreatorStats = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const cid = parseInt(creatorId);

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(now.getDate() - 14);

    // Total sales (all time)
    const totalSales = await prisma.purchase.count({
      where: { post: { creatorId: cid } }
    });

    // Sales in last 7 days
    const recentSales = await prisma.purchase.count({
      where: { 
        post: { creatorId: cid },
        createdAt: { gte: sevenDaysAgo }
      }
    });

    // Sales in previous 7 days (for delta)
    const previousSales = await prisma.purchase.count({
      where: {
        post: { creatorId: cid },
        createdAt: { 
          gte: fourteenDaysAgo,
          lt: sevenDaysAgo
        }
      }
    });

    const salesDelta = previousSales === 0 
      ? (recentSales > 0 ? `+${recentSales}` : '+0')
      : `${recentSales >= previousSales ? '+' : ''}${Math.round(((recentSales - previousSales) / previousSales) * 100)}%`;

    // Top performing posts
    const topPosts = await prisma.post.findMany({
      where: { creatorId: cid },
      include: {
        _count: { select: { purchases: true } }
      },
      orderBy: { purchases: { _count: 'desc' } },
      take: 5
    });

    res.json({
      totalSales: {
        val: totalSales.toString(),
        delta: salesDelta
      },
      contentViews: { val: (totalSales * 12 + Math.floor(Math.random() * 50)).toString(), delta: '+12%' }, // Simulated but related
      topPosts: topPosts.map(post => ({
        id: post.id,
        title: post.title,
        price: post.price,
        sales: post._count.purchases,
        views: post._count.purchases * 15 + 10,
        img: post.previewUrl
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getEarningsStats = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const cid = parseInt(creatorId);

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    // Get all purchases made on this creator's posts (Gross Volume)
    const sales = await prisma.purchase.findMany({
      where: { post: { creatorId: cid } },
      include: {
        buyer: { select: { name: true } },
        post: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get all purchases made by this user (Expenses)
    const purchasesAsBuyer = await prisma.purchase.findMany({
        where: { buyerId: cid }
    });
    
    // Get user's withdrawals
    const withdrawals = await prisma.withdrawal.findMany({
        where: { creatorId: cid, status: { in: ["PENDING", "COMPLETED"] } }
    });

    const grossVolume = sales.reduce((acc, p) => acc + p.amount, 0);
    const totalExpenses = purchasesAsBuyer.reduce((acc, p) => acc + p.amount, 0);
    const totalWithdrawals = withdrawals.reduce((acc, w) => acc + w.amount, 0);
    
    const feeRate = 0.10; // 10% platform fee
    const netVolume = grossVolume * (1 - feeRate);
    const availableBalance = netVolume - totalWithdrawals;

    // Generate chart data (last 7 days)
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const chartData = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayName = days[d.getDay()];
      
      const dayStart = new Date(d.setHours(0, 0, 0, 0));
      const dayEnd = new Date(d.setHours(23, 59, 59, 999));
      
      const dayAmount = sales
        .filter(p => p.createdAt >= dayStart && p.createdAt <= dayEnd)
        .reduce((acc, p) => acc + p.amount, 0);
        
      // On affiche le net dans le graph
      chartData.push({ name: dayName, amount: dayAmount * (1 - feeRate) });
    }

    res.json({
      availableBalance: availableBalance,
      grossVolume,
      totalExpenses,
      totalWithdrawals,
      chartData: chartData,
      recentTransactions: sales.map(p => ({
        id: p.id,
        contentTitle: p.post.title,
        amount: p.amount,
        net: p.amount * (1 - feeRate),
        date: p.createdAt,
        buyerName: p.buyer.name
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getCreatorStats, getEarningsStats };
