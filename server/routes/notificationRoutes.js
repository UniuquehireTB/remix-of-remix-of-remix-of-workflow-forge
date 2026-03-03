const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
} = require('../controllers/notificationController');

router.get('/', authMiddleware, getNotifications);
router.put('/mark-all-read', authMiddleware, markAllAsRead);
router.delete('/clear-all', authMiddleware, deleteAllNotifications);
router.put('/:id/read', authMiddleware, markAsRead);
router.delete('/:id', authMiddleware, deleteNotification);

module.exports = router;
