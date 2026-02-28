const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Check if email already exists
        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Check if username already exists
        const existingUsername = await User.findOne({ where: { username } });
        if (existingUsername) {
            return res.status(400).json({ message: 'Username is already taken' });
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password,
            role,
            createdBy: req.user ? req.user.id : null,
            modifiedBy: req.user ? req.user.id : null
        });

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        // Handle Sequelize unique constraint error
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.errors?.[0]?.path || 'field';
            return res.status(400).json({ message: `User already exists with this ${field}` });
        }
        res.status(500).json({ message: 'Server error during registration' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

const refresh = async (req, res) => {
    try {
        // req.user is set by authMiddleware
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        // Find user to make sure they still exist and get latest info
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(401).json({ message: 'User no longer exists' });
        }

        // Generate new JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Token refreshed successfully',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ message: 'Server error during token refresh' });
    }
};

module.exports = { register, login, refresh };
