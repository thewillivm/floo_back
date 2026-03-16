const prisma = require('../config/prisma');

const createPurchase = async (req, res) => {
  try {
    const { buyerId, postId, amount } = req.body;
    
    const bId = parseInt(buyerId);
    const pId = parseInt(postId);
    const amt = parseFloat(amount);

    if (isNaN(bId) || isNaN(pId)) {
      return res.status(400).json({ error: "Identifiants invalides." });
    }

    // Check if purchase already exists
    const existingPurchase = await prisma.purchase.findFirst({
      where: { buyerId: bId, postId: pId }
    });

    if (existingPurchase) {
      return res.status(400).json({ error: "Vous avez déjà acheté ce contenu." });
    }

    // Create the purchase
    const purchase = await prisma.purchase.create({
      data: {
        buyerId: bId,
        postId: pId,
        amount: amt
      },
      include: {
        post: { include: { creator: true } },
        buyer: true
      }
    });

    // Notify creator
    try {
      await prisma.notification.create({
        data: {
          userId: purchase.post.creatorId,
          actorId: bId,
          type: 'SALE',
          title: 'Nouvele vente !',
          message: `${purchase.buyer.name} a acheté votre post "${purchase.post.title}"`,
          link: `/post/${purchase.post.id}`
        }
      });

      // Send Email to creator
      if (purchase.post.creator.email) {
        const { sendEmail } = require('../config/mailService');
        const subject = 'Vous avez réalisé une vente !';
        const html = `
          <h1>Félicitations !</h1>
          <p>${purchase.buyer.name} vient d'acheter votre contenu "${purchase.post.title}".</p>
          <p>Montant : ${amt} FCFA</p>
        `;
        sendEmail(purchase.post.creator.email, subject, html);
      }
    } catch (notifErr) {
      console.error("Failed to notify creator about sale:", notifErr);
    }

    res.status(201).json(purchase);
  } catch (error) {
    console.error("[ERROR] createPurchase:", error);
    res.status(500).json({ error: error.message });
  }
};

const getUserPurchases = async (req, res) => {
  try {
    const { userId } = req.params;
    const uId = parseInt(userId);
    
    const purchases = await prisma.purchase.findMany({
      where: { buyerId: uId },
      include: {
        post: {
          include: {
            creator: {
              select: { id: true, name: true, username: true, avatar: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createPurchase, getUserPurchases };

