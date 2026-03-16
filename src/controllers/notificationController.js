const prisma = require('../config/prisma');

const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await prisma.notification.findMany({
      where: { userId: parseInt(userId) },
      include: {
        actor: {
          select: { id: true, name: true, username: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { isRead: true }
    });
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    await prisma.notification.updateMany({
      where: { userId: parseInt(userId), isRead: false },
      data: { isRead: true }
    });
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
