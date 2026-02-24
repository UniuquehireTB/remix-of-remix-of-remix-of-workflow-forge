// Vercel Serverless Entry Point (CommonJS — handled by @vercel/node builder)
const app = require('../server/index.js');

module.exports = async (req, res) => {
    try {
        return app(req, res);
    } catch (error) {
        console.error('Vercel handler error:', error);
        res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
};
