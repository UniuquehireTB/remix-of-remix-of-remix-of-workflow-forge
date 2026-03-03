const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const ProjectInvitation = sequelize.define('ProjectInvitation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    projectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'The user being invited'
    },
    invitedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'The user who sent the invite'
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'declined'),
        defaultValue: 'pending',
        allowNull: false,
    },
}, {
    tableName: 'ProjectInvitations',
    timestamps: true
});

module.exports = ProjectInvitation;
