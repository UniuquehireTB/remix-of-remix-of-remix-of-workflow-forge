const { Notification, User } = require('../models');

const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { userId: req.user.id, isActive: true },
            include: [
                { model: User, as: 'sender', attributes: ['id', 'username'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.update({ isRead: true }, {
            where: { id, userId: req.user.id }
        });
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        await Notification.update({ isRead: true }, {
            where: { userId: req.user.id }
        });
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.update({ isActive: false }, {
            where: { id, userId: req.user.id }
        });
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper function to create notifications (to be used in other controllers)
const createNotification = async ({ userId, senderId, title, message, type, targetId }) => {
    try {
        // Don't notify yourself
        if (userId === senderId) return null;

        return await Notification.create({
            userId,
            senderId,
            title,
            message,
            type,
            targetId,
            isActive: true,
            createdBy: senderId,
            modifiedBy: senderId
        });
    } catch (error) {
        console.error('Failed to create notification:', error);
        return null;
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification
};
