const { User } = require('../models');
const { Op } = require('sequelize');

const getMembersList = async (req, res) => {
    try {
        const users = await User.findAll({
            where: {
                isActive: true,
                id: { [Op.ne]: req.user.id }
            },
            attributes: ['id', 'username', 'role']
        });
        res.json(users);
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            where: { isActive: true },
            attributes: ['id', 'username', 'email', 'role', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });
        res.json(users);
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, role } = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check if email is taken by another user
        if (email && email !== user.email) {
            const existing = await User.findOne({ where: { email, id: { [Op.ne]: id } } });
            if (existing) return res.status(400).json({ message: 'Email is already in use by another account' });
        }

        // Check if username is taken
        if (username && username !== user.username) {
            const existing = await User.findOne({ where: { username, id: { [Op.ne]: id } } });
            if (existing) return res.status(400).json({ message: 'Username is already taken' });
        }

        await user.update({ username, email, role, modifiedBy: req.user?.id });
        res.json({ message: 'User updated successfully', user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (error) {
        console.error('Error updating user:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Email or username already in use' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getMembersList, getAllUsers, updateUser };

