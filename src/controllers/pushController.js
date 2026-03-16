const prisma = require('../config/prisma');

const subscribe = async (req, res) => {
  console.log('Received subscription request for user:', req.body.userId);
  try {
    const { userId, subscription } = req.body;
    
    if (!subscription || !subscription.endpoint) {
      console.error('Invalid subscription object received');
      return res.status(400).json({ error: 'Invalid subscription object' });
    }

    // Upsert subscription
    const savedSubscription = await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId: parseInt(userId),
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      },
      create: {
        userId: parseInt(userId),
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    });

    console.log('Subscription saved successfully:', savedSubscription.id);
    res.status(201).json(savedSubscription);
  } catch (error) {
    console.error('Error in subscription endpoint:', error);
    res.status(500).json({ error: error.message });
  }
};

const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    await prisma.pushSubscription.delete({
      where: { endpoint }
    });
    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { subscribe, unsubscribe };
