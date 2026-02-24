const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');
const { baseEntityAttributes } = require('./BaseEntity');

const Note = sequelize.define('Note', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    type: {
        type: DataTypes.STRING,
        defaultValue: 'note', // note, list
    },
    listItems: {
        type: DataTypes.JSON, // Stores the checklist items as an array
        allowNull: true,
    },
    pinned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    projectId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    ...baseEntityAttributes,
}, {
    tableName: 'Notes'
});

module.exports = Note;
