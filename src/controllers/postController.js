const prisma = require('../config/prisma');
const { sendEmail } = require('../config/mailService');
const { sendPushNotification } = require('../services/pushService');

const getAllPosts = async (req, res) => {
  try {
    const { requesterId } = req.query;
    const rId = (requesterId && !isNaN(parseInt(requesterId))) ? parseInt(requesterId) : null;

    const posts = await prisma.post.findMany({
      include: {
        creator: {
          select: { id: true, name: true, username: true, avatar: true }
        },
        purchases: rId ? {
          where: { buyerId: rId }
        } : false
      },
      orderBy: { createdAt: 'desc' }
    });

    const results = posts.map(p => ({
      ...p,
      isUnlocked: rId ? (p.price === 0 || (p.purchases && p.purchases.length > 0) || p.creatorId === rId) : (p.price === 0)
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const { requesterId } = req.query;
    const rId = (requesterId && !isNaN(parseInt(requesterId))) ? parseInt(requesterId) : null;

    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
      include: { 
        creator: true,
        purchases: rId ? {
          where: { buyerId: rId }
        } : false
      }
    });

    if (!post) return res.status(404).json({ error: 'Post not found' });

    const result = {
      ...post,
      isUnlocked: rId ? (post.price === 0 || (post.purchases && post.purchases.length > 0) || post.creatorId === rId) : (post.price === 0)
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createPost = async (req, res) => {
  try {
    const { title, description, type, price, creatorId } = req.body;
    
    let previewUrl = req.body.previewUrl || '';
    let fullUrl = req.body.fullUrl || '';

    if (req.file) {
      const relativePath = `/uploads/${creatorId}/${req.file.filename}`;
      fullUrl = relativePath;
      if (!previewUrl) {
        previewUrl = relativePath;
      }
    }

    const post = await prisma.post.create({
      data: { 
        title, 
        description, 
        type, 
        price: parseFloat(price), 
        previewUrl, 
        fullUrl, 
        creatorId: parseInt(creatorId) 
      },
      include: {
        creator: true
      }
    });

    // Notify followers (Email + Push)
    try {
      console.log('Fetching followers for creator:', creatorId);
      const followers = await prisma.follow.findMany({
        where: { followingId: parseInt(creatorId) },
        include: { 
          follower: {
            include: { pushSubscriptions: true }
          }
        }
      });
      console.log(`Found ${followers.length} followers to notify`);

      const notificationPayload = {
        title: `Nouveau post de ${post.creator.name} !`,
        body: title,
        icon: post.creator.avatar || '/icon-192.png',
        data: {
          url: `/post/${post.id}`
        }
      };

      const emailSubject = `Nouveau post de ${post.creator.name} !`;
      const emailHtml = `
        <h1>${post.creator.name} vient de publier un nouveau contenu !</h1>
        <p>Venez découvrir "${title}" dès maintenant.</p>
        <p>${description || ''}</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/post/${post.id}">Voir le post</a>
      `;

      followers.forEach(async (follow) => {
        // Create Internal Notification
        try {
          await prisma.notification.create({
            data: {
              userId: follow.followerId,
              actorId: parseInt(creatorId),
              type: 'NEW_POST',
              title: `Nouveau post de ${post.creator.name}`,
              message: title,
              link: `/post/${post.id}`
            }
          });
        } catch (notifErr) {
          console.error("Failed to create internal notification:", notifErr);
        }

        // Send Email
        if (follow.follower.email) {
          console.log(`Sending email notification to: ${follow.follower.email}`);
          sendEmail(follow.follower.email, emailSubject, emailHtml);
        }

        // Send Push Notifications
        if (follow.follower.pushSubscriptions && follow.follower.pushSubscriptions.length > 0) {
          console.log(`Sending ${follow.follower.pushSubscriptions.length} push notifications to: ${follow.follower.username}`);
          follow.follower.pushSubscriptions.forEach(async (sub) => {
            try {
              const success = await sendPushNotification(sub, notificationPayload);
              if (!success) {
                console.log(`Removing invalid subscription for user ${follow.follower.id}: ${sub.endpoint}`);
                await prisma.pushSubscription.delete({ where: { id: sub.id } });
              } else {
                console.log(`Push notification sent successfully to ${sub.endpoint}`);
              }
            } catch (pushErr) {
              console.error(`Failed to send push notification to ${sub.endpoint}:`, pushErr);
            }
          });
        } else {
          console.log(`No push subscriptions found for user: ${follow.follower.username}`);
        }
      });
    } catch (notifyError) {
      console.error('Failed to notify followers:', notifyError);
    }

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const searchPosts = async (req, res) => {
  try {
    const { q, requesterId } = req.query;
    const rId = (requesterId && !isNaN(parseInt(requesterId))) ? parseInt(requesterId) : null;

    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } }
        ]
      },
      include: {
        creator: {
          select: { id: true, name: true, username: true, avatar: true }
        },
        purchases: rId ? {
          where: { buyerId: rId }
        } : false
      },
      take: 20
    });

    const results = posts.map(p => ({
      ...p,
      isUnlocked: rId ? (p.price === 0 || (p.purchases && p.purchases.length > 0) || p.creatorId === rId) : (p.price === 0)
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllPosts, getPostById, createPost, searchPosts };
