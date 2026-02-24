const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

const { getMembersList } = require('../controllers/userController');

router.get('/profile', authMiddleware, (req, res) => {
    res.json({ message: 'Protected profile data', user: req.user });
});

router.get('/members-list', authMiddleware, getMembersList);

module.exports = router;
