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

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check with detailed diagnostics
app.get(['/api/health', '/health'], async (req, res) => {
    try {
        await connectDB();
        await sequelize.sync({ alter: true });
        isDbInitialized = true;
        res.json({
            status: 'ok',
            database: 'connected and synced',
            url: process.env.DATABASE_URL ? 'URL detected' : 'URL missing',
            env: process.env.NODE_ENV,
            path: req.path
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
            stack: process.env.NODE_ENV === 'production' ? null : error.stack
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

// Database Initialization Middleware for Serverless
let isDbInitialized = false;
const initDb = async (req, res, next) => {
    if (!isDbInitialized) {
        try {
            await connectDB();
            await sequelize.sync({ alter: true });
            console.log('Database synced successfully in serverless environment');
            isDbInitialized = true;
        } catch (error) {
            console.error('Database initialization failed:', error);
            return res.status(500).json({ message: 'Database initialization failed' });
        }
    }
    next();
};

if (process.env.VERCEL) {
    app.use(initDb);
}

// Database Sync and Server Listen
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        await sequelize.sync({ alter: true });
        console.log('Database synced');
        isDbInitialized = true;

        if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
        }
    } catch (error) {
        console.error('Failed to start server:', error);
    }
};

// Only call startServer if not being imported as a module (e.g., by Vercel)
if (require.main === module) {
    startServer();
}

module.exports = app;
