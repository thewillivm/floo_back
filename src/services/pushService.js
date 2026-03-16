const webpush = require('web-push');

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:votre_email@gmail.com', // Replace with a real email if needed
    vapidPublicKey,
    vapidPrivateKey
  );
}

const sendPushNotification = async (subscription, payload) => {
  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    };
    
    await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error('Push notification error:', error);
    // If subscription is invalid/expired, it should be deleted (handled in controller)
    if (error.statusCode === 410 || error.statusCode === 404) {
      return false; // Subscription gone
    }
    throw error;
  }
};

module.exports = { sendPushNotification };
