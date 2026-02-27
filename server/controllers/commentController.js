const { Comment, User, Ticket, TicketAssignee } = require('../models');
const { createNotification } = require('./notificationController');

const getCommentsByTicketId = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const comments = await Comment.findAll({
            where: { ticketId, isActive: true },
            include: [
                { model: User, as: 'user', attributes: ['id', 'username', 'role'] }
            ],
            order: [['createdAt', 'ASC']]
        });
        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const addComment = async (req, res) => {
    try {
        const { ticketId, content } = req.body;
        const userId = req.user.id;

        const comment = await Comment.create({
            ticketId,
            content,
            userId,
            createdBy: userId,
            modifiedBy: userId
        });

        const fullComment = await Comment.findByPk(comment.id, {
            include: [
                { model: User, as: 'user', attributes: ['id', 'username', 'role'] }
            ]
        });

        // Notify Assignees + Creator
        const ticket = await Ticket.findByPk(ticketId);
        if (ticket) {
            const assignees = await TicketAssignee.findAll({ where: { ticketId } });
            const notifyIds = new Set(assignees.map(a => a.userId));
            notifyIds.add(ticket.createdBy);

            // Don't notify the person who made the comment
            notifyIds.delete(userId);

            for (const targetId of notifyIds) {
                await createNotification({
                    userId: targetId,
                    senderId: userId,
                    title: 'New Comment',
                    message: `${req.user.username} commented on ${ticket.ticketId}`,
                    type: 'ticket',
                    targetId: ticketId
                });
            }
        }

        res.status(201).json(fullComment);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getCommentsByTicketId,
    addComment
};
