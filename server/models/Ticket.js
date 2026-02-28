const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');
const { baseEntityAttributes } = require('./BaseEntity');

const Ticket = sequelize.define('Ticket', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    ticketId: { // Human readable ID like TK-1001
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    type: {
        type: DataTypes.STRING,
        defaultValue: 'Task', // Bug, Feature, Improvement, Task
    },
    priority: {
        type: DataTypes.STRING,
        defaultValue: 'Medium', // Low, Medium, High, Critical
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'Open', // Open, In Progress, Closed
    },
    projectId: {
        type: DataTypes.INTEGER,
        allowNull: true, // null = General/Global ticket
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    closedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    dueHistory: {
        type: DataTypes.JSON, // Array of { from, to, reason, userId, timestamp }
        allowNull: true,
        defaultValue: []
    },
    ...baseEntityAttributes,
}, {
    tableName: 'Tickets'
});

module.exports = Ticket;
