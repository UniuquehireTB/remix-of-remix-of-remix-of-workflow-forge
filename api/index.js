// This file is treated as CommonJS by Vercel because it lives
// in api/ which is explicitly built with @vercel/node
const { connectDB, sequelize } = require('../server/db');
const app = require('../server/index.js');

let isReady = false;

module.exports = async (req, res) => {
    try {
        if (!isReady) {
            await connectDB();
            await sequelize.sync({ alter: true });
            isReady = true;
            console.log('DB synced — tables created/updated.');
        }
        return app(req, res);
    } catch (error) {
        console.error('Vercel handler error:', error);
        res.status(500).json({ error: error.message });
    }
};
