const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');
const { baseEntityAttributes } = require('./BaseEntity');

const Comment = sequelize.define('Comment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    ticketId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    ...baseEntityAttributes,
}, {
    tableName: 'Comments'
});

module.exports = Comment;
