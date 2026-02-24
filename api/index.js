// Diagnostic wrapper — catches any crash during module loading
let app;
let loadError;

try {
    app = require('../server/index.js');
} catch (error) {
    loadError = error;
    console.error('CRITICAL: Failed to load server module:', error.message);
    console.error('Stack:', error.stack);
}

module.exports = async (req, res) => {
    // If module failed to load, return the exact error so we can see it
    if (loadError) {
        return res.status(500).json({
            error: 'Server module failed to load',
            message: loadError.message,
            stack: loadError.stack ? loadError.stack.substring(0, 800) : null
        });
    }

    try {
        return app(req, res);
    } catch (error) {
        console.error('Vercel handler error:', error);
        res.status(500).json({
            error: 'Request handler error',
            message: error.message
        });
    }
};
