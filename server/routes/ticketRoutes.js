const express = require('express');
const router = express.Router();
const { getAllTickets, createTicket, updateTicketStatus, updateTicketRemarks, updateTicket, deleteTicket } = require('../controllers/ticketController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getAllTickets);
router.post('/', authMiddleware, createTicket);
router.put('/:id', authMiddleware, updateTicket);
router.put('/:id/status', authMiddleware, updateTicketStatus);
router.put('/:id/remarks', authMiddleware, updateTicketRemarks);
router.delete('/:id', authMiddleware, deleteTicket);

module.exports = router;
