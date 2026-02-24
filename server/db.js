const { Sequelize } = require('sequelize');
require('dotenv').config();

// Explicitly require pg so Vercel's bundler includes it in the deployment.
// Sequelize dynamically loads it internally which nft (static tracer) can't detect.
const pg = require('pg');

const sequelize = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectModule: pg,  // ← critical fix: pass pg explicitly
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    })
    : new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            dialect: 'postgres',
            dialectModule: pg,
            logging: false,
        }
    );

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL Database connected successfully via Sequelize.');
    } catch (error) {
        console.error('Unable to connect to the database:', error.message);
        throw error; // Never call process.exit in serverless!
    }
};

module.exports = { sequelize, connectDB };
