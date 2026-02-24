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

module.exports = {
    getMembersList
};
