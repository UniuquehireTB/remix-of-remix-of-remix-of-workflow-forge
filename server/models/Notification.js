const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');
const { baseEntityAttributes } = require('./BaseEntity');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'The user who receives the notification'
    },
    senderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'The user who triggered the notification'
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING,
        defaultValue: 'general', // ticket, project, note, general
    },
    targetId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of the related entity (ticketId, projectId, etc.)'
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    ...baseEntityAttributes,
}, {
    tableName: 'Notifications',
    timestamps: true
});

module.exports = Notification;
