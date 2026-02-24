const { DataTypes } = require('sequelize');

const baseEntityAttributes = {
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    modifiedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
};

module.exports = { baseEntityAttributes };
