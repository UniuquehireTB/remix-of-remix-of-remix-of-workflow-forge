const app = require('../server/index.js');
const { connectDB, sequelize } = require('../server/db');

module.exports = async (req, res) => {
    try {
        // Ensure DB is connected and synced on every lambda wake-up
        await connectDB();
        await sequelize.sync({ alter: true });
        return app(req, res);
    } catch (error) {
        console.error('Vercel Entry Error:', error);
        res.status(500).send(error.message);
    }
};
