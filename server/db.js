const { Sequelize } = require('sequelize');
require('dotenv').config();

// Explicitly require pg so Vercel's bundler includes it in the deployment.
// Sequelize dynamically loads it internally which nft (static tracer) can't detect.
const pg = require('pg');

const isProduction = process.env.NODE_ENV === 'production';

let sequelize;

if (isProduction) {
    // ── PRODUCTION ─────────────────────────────────────────────────
    // Uses Neon DATABASE_URL set in the Vercel dashboard.
    if (!process.env.DATABASE_URL) {
        throw new Error('[db.js] DATABASE_URL is required in production but was not set.');
    }
    console.log('[db.js] 🌐 Connecting to Neon (production)...');
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectModule: pg,
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
    });
} else {
    // ── DEVELOPMENT ────────────────────────────────────────────────
    // Uses local PostgreSQL credentials from server/.env
    console.log('[db.js] 🛠️  Connecting to local PostgreSQL (development)...');
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            dialect: 'postgres',
            dialectModule: pg,
            logging: false,
        }
    );
}

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log(`PostgreSQL (${isProduction ? 'Neon/production' : 'local/development'}) connected successfully.`);
    } catch (error) {
        console.error('Unable to connect to the database:', error.message);
        throw error; // Never call process.exit in serverless!
    }
};

module.exports = { sequelize, connectDB };
