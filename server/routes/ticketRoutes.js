const express = require('express');
const router = express.Router();
const { getAllTickets, getTicketById, createTicket, updateTicketStatus, updateTicket, deleteTicket, getTicketStatsByProject, extendTicketDueDate } = require('../controllers/ticketController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getAllTickets);
router.get('/stats', authMiddleware, getTicketStatsByProject);
router.get('/:id', authMiddleware, getTicketById);
router.post('/', authMiddleware, createTicket);
router.put('/:id', authMiddleware, updateTicket);
router.put('/:id/status', authMiddleware, updateTicketStatus);
router.put('/:id/extend-due-date', authMiddleware, extendTicketDueDate);
router.delete('/:id', authMiddleware, deleteTicket);

module.exports = router;
