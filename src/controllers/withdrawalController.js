const prisma = require('../config/prisma');

const requestWithdrawal = async (req, res) => {
  try {
    const { creatorId, amount, phone, paymentMethod } = req.body;
    const cid = parseInt(creatorId);
    const amt = parseFloat(amount);

    if (isNaN(cid) || isNaN(amt) || amt <= 0) {
      return res.status(400).json({ error: "Montant ou identifiant invalide." });
    }
    if (!phone || !paymentMethod) {
      return res.status(400).json({ error: "Numéro de téléphone et réseau obligatoires." });
    }

    // Calcul du solde disponible (Net = Brut - 10%)
    const purchases = await prisma.purchase.findMany({
      where: { post: { creatorId: cid } }
    });

    const withdrawals = await prisma.withdrawal.findMany({
      where: { creatorId: cid, status: { in: ["PENDING", "COMPLETED"] } }
    });

    const grossVolume = purchases.reduce((acc, p) => acc + p.amount, 0);
    const feeRate = 0.10;
    const netVolume = grossVolume * (1 - feeRate);
    const totalWithdrawn = withdrawals.reduce((acc, w) => acc + w.amount, 0);

    const availableBalance = netVolume - totalWithdrawn;

    if (amt > availableBalance) {
      return res.status(400).json({ error: "Solde insuffisant." });
    }

    // Créer la demande structurée 
    await prisma.withdrawal.create({
      data: {
        creatorId: cid,
        amount: amt,
        status: "PENDING",
        phone,
        paymentMethod
      }
    });

    res.json({ message: "Demande de retrait enregistrée et en attente de traitement.", amount: amt, status: "PENDING" });

  } catch (error) {
    console.error("[ERROR] requestWithdrawal:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { requestWithdrawal };
