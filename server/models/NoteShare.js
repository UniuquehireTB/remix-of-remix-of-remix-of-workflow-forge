const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const NoteShare = sequelize.define('NoteShare', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    noteId: {
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
    tableName: 'NoteShares',
    timestamps: true
});

module.exports = NoteShare;
