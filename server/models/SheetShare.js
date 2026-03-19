const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const SheetShare = sequelize.define('SheetShare', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    sheetId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    sharedWithUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    sharedByUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    canEdit: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    }
}, {
    tableName: 'SheetShares',
    timestamps: true
});

module.exports = SheetShare;
