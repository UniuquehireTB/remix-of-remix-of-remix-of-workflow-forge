require('dotenv').config();
const { sequelize, connectDB } = require('./db');
require('./models'); // Load all models so sequelize knows the tables

const syncDatabase = async () => {
    try {
        console.log('Connecting to Neon database...');
        await connectDB();
        console.log('Connected! Syncing tables...');
        await sequelize.sync({ alter: true });
        console.log('✅ All tables created/updated successfully in Neon!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Sync failed:', error.message);
        process.exit(1);
    }
};

syncDatabase();
