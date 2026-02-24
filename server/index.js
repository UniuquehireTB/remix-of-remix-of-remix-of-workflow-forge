const express = require('express');
const cors = require('cors');
const { connectDB, sequelize } = require('./db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
require('dotenv').config();

const projectRoutes = require('./routes/projectRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const noteRoutes = require('./routes/noteRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/notifications', notificationRoutes);

// Database Sync and Server Listen
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        await sequelize.sync({ alter: true });
        console.log('Database synced');

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
