const express = require('express');
const router = express.Router();
const { getAllTickets, getTicketById, createTicket, updateTicketStatus, updateTicket, deleteTicket } = require('../controllers/ticketController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getAllTickets);
router.get('/:id', authMiddleware, getTicketById);
router.post('/', authMiddleware, createTicket);
router.put('/:id', authMiddleware, updateTicket);
router.put('/:id/status', authMiddleware, updateTicketStatus);
router.delete('/:id', authMiddleware, deleteTicket);

module.exports = router;
