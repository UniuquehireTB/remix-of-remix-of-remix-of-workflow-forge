const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const TicketAssignee = sequelize.define('TicketAssignee', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    ticketId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    joinDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
}, {
    tableName: 'TicketAssignees',
    timestamps: true
});

module.exports = TicketAssignee;
