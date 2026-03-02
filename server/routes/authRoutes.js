const express = require('express');
const { register, login, refresh } = require('../controllers/authController');
const { authMiddleware, authRefreshMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', authMiddleware, register);
router.post('/login', login);
router.post('/refresh', authRefreshMiddleware, refresh);

module.exports = router;
