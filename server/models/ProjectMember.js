const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const ProjectMember = sequelize.define('ProjectMember', {
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
    },
}, {
    tableName: 'ProjectMembers',
    timestamps: true
});

module.exports = ProjectMember;
