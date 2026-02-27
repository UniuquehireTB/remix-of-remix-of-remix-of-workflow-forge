const express = require('express');
const cors = require('cors');
const { connectDB, sequelize } = require('./db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
require('./models'); // Required to load models and associations for sync
require('dotenv').config();

const projectRoutes = require('./routes/projectRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const noteRoutes = require('./routes/noteRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Ensure DB is connected before handling any request (lazy, cached connection)
let dbConnected = false;
app.use(async (req, res, next) => {
    if (!dbConnected) {
        try {
            await connectDB();
            dbConnected = true;
        } catch (error) {
            console.error('DB connection failed:', error.message);
            return res.status(500).json({
                error: 'Database connection failed',
                message: error.message,
                hint: 'Check DATABASE_URL environment variable in Vercel dashboard'
            });
        }
    }
    next();
});

// Super simple status check
app.get('/api/status', (req, res) => res.json({
    status: 'Backend is alive',
    db: dbConnected ? 'connected' : 'not connected',
    env: process.env.NODE_ENV,
    hasDbUrl: !!process.env.DATABASE_URL
}));

// Health check with detailed diagnostics
app.get(['/api/health', '/health'], async (req, res) => {
    try {
        await connectDB();
        res.json({
            status: 'ok',
            database: 'connected',
            url: process.env.DATABASE_URL ? 'URL detected' : 'URL MISSING - add to Vercel env vars!',
            env: process.env.NODE_ENV,
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/comments', commentRoutes);

// Local dev server startup
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        await sequelize.sync({ alter: true });
        console.log('Database synced');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
    }
};

// Vercel runs this as a module — only listen locally
if (require.main === module) {
    startServer();
}

module.exports = app;
