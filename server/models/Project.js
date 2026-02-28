const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');
const { baseEntityAttributes } = require('./BaseEntity');

const Project = sequelize.define('Project', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    client: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    projectCode: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    ...baseEntityAttributes,
}, {
    tableName: 'Projects'
});

module.exports = Project;
