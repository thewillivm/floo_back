const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

const getAllUsers = async (req, res) => {
  try {
    const { requesterId } = req.query;
    const rId = (requesterId && !isNaN(parseInt(requesterId))) ? parseInt(requesterId) : null;
    console.log(`[DEBUG] getAllUsers - requesterId: ${requesterId}, parsed: ${rId}`);

    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { followers: true }
        },
        followers: rId ? {
          where: { followerId: rId },
          select: { id: true }
        } : false
      }
    });

    const results = users.map(u => ({
      ...u,
      isFollowing: u.followers ? u.followers.length > 0 : false
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { posts: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserByUsername = async (req, res) => {
    try {
      const { username } = req.params;
      const { requesterId } = req.query;
      const rId = (requesterId && !isNaN(parseInt(requesterId))) ? parseInt(requesterId) : null;

      console.log(`[DEBUG] Fetching profile for username: ${username}, requester: ${rId}`);
      const user = await prisma.user.findUnique({
        where: { username },
        include: {
          posts: {
            include: {
              purchases: rId ? {
                where: { buyerId: rId }
              } : false
            }
          },
          _count: {
            select: { followers: true, following: true, posts: true }
          },
          followers: rId ? {
            where: { followerId: rId },
            select: { id: true }
          } : false
        }
      });

      if (!user) {
        console.log(`[DEBUG] User not found for username: ${username}`);
        return res.status(404).json({ error: 'User not found' });
      }

      // Process posts to add isUnlocked
      const processedPosts = user.posts.map(p => ({
        ...p,
        isUnlocked: rId ? (p.price === 0 || (p.purchases && p.purchases.length > 0) || p.creatorId === rId) : (p.price === 0)
      }));

      const result = {
        ...user,
        posts: processedPosts,
        isFollowing: user.followers ? user.followers.length > 0 : false
      };

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

const searchUsers = async (req, res) => {
  try {
    const { q, requesterId } = req.query;
    const rId = (requesterId && !isNaN(parseInt(requesterId))) ? parseInt(requesterId) : null;
    console.log(`[DEBUG] searchUsers - q: ${q}, requesterId: ${requesterId}, parsed: ${rId}`);

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } }
        ]
      },
      include: {
        _count: {
          select: { followers: true }
        },
        followers: rId ? {
          where: { followerId: rId },
          select: { id: true }
        } : false
      },
      take: 20
    });

    const results = users.map(u => ({
      id: u.id,
      name: u.name,
      username: u.username,
      avatar: u.avatar,
      role: u.role,
      _count: u._count,
      isFollowing: u.followers ? u.followers.length > 0 : false
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const followUser = async (req, res) => {
  try {
    const { followerId, followingId } = req.body;
    console.log(`[DEBUG] Follow attempt: ${followerId} -> ${followingId}`);
    
    const fId = parseInt(followerId);
    const tId = parseInt(followingId);

    if (isNaN(fId) || isNaN(tId)) {
      return res.status(400).json({ error: "Invalid IDs provided" });
    }

    if (fId === tId) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    // Check if both users exist
    const [follower, following] = await Promise.all([
      prisma.user.findUnique({ where: { id: fId } }),
      prisma.user.findUnique({ where: { id: tId } })
    ]);

    if (!follower) {
      return res.status(404).json({ error: "Votre compte est introuvable (sesssion invalide). Veuillez vous reconnecter." });
    }
    if (!following) {
      return res.status(404).json({ error: "Le créateur que vous tentez de suivre est introuvable." });
    }

    try {
      const follow = await prisma.follow.create({
        data: {
          followerId: fId,
          followingId: tId
        }
      });

      // --- Notifications Logic ---
      try {
        // 1. Internal Notification
        await prisma.notification.create({
          data: {
            userId: tId,
            actorId: fId,
            type: 'NEW_FOLLOW',
            title: 'Nouvel abonné !',
            message: `${follower.name} (@${follower.username}) vous suit désormais.`,
            link: `/profile/${follower.username}`
          }
        });

        // 2. Email Notification
        if (following.email) {
          const { sendEmail } = require('../config/mailService');
          const subject = `${follower.name} vous suit sur FLOO !`;
          const html = `
            <h1>Bonne nouvelle !</h1>
            <p><strong>${follower.name}</strong> (@${follower.username}) s'est abonné à votre compte.</p>
            <p>Continuez à poster du contenu de qualité pour fidéliser votre audience !</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile/${follower.username}">Voir son profil</a>
          `;
          sendEmail(following.email, subject, html);
        }

        // 3. Push Notification
        const pushSubscriptions = await prisma.pushSubscription.findMany({
          where: { userId: tId }
        });
        
        if (pushSubscriptions.length > 0) {
          const { sendPushNotification } = require('../services/pushService');
          const payload = {
            title: 'Nouvel abonné !',
            body: `${follower.name} vous suit désormais.`,
            icon: follower.avatar || '/icon-192.png',
            data: { url: `/profile/${follower.username}` }
          };

          pushSubscriptions.forEach(sub => {
            sendPushNotification(sub, payload).catch(err => console.error("Push error:", err));
          });
        }
      } catch (notifErr) {
        console.error("Error sending follow notifications:", notifErr);
      }
      // --- End Notifications Logic ---

      res.json(follow);
    } catch (err) {
      if (err.code === 'P2002') {
        return res.status(400).json({ error: "You are already following this user" });
      }
      throw err;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const unfollowUser = async (req, res) => {
  try {
    const { followerId, followingId } = req.body;
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: parseInt(followerId),
          followingId: parseInt(followingId)
        }
      }
    });
    res.json({ message: "Unfollowed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bio, email, phone } = req.body;
    console.log(`Updating profile for ID: ${id}`, { name, bio, email, phone });
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        bio,
        email,
        phone
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("[ERROR] updateProfile:", error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "Cet email ou ce nom d'utilisateur est déjà utilisé." });
    }
    res.status(500).json({ error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    const userId = parseInt(id);

    // Find user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllUsers, getUserById, getUserByUsername, searchUsers, followUser, unfollowUser, updateProfile, changePassword };
