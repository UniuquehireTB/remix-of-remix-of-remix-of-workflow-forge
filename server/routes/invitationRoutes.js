const express = require('express');
const router = express.Router();
const { getPendingInvitations, respondToInvitation } = require('../controllers/invitationController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/pending', authMiddleware, getPendingInvitations);
router.put('/:id/respond', authMiddleware, respondToInvitation);

module.exports = router;
