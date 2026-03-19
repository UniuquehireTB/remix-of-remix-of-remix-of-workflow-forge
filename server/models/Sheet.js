const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Sheet = sequelize.define('Sheet', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Untitled Sheet',
  },
  data: {
    type: DataTypes.JSONB, 
    allowNull: false,
    defaultValue: [] 
  },
  userId: {
    type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    }
}, {
    timestamps: true
});

module.exports = Sheet;
