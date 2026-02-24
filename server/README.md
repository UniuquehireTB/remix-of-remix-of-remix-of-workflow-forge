# Express Backend with PostgreSQL

This is a Node.js Express backend with PostgreSQL integration using Sequelize.

## Features
- User registration
- Password encryption (bcryptjs)
- JWT Authentication
- Sequelize ORM for PostgreSQL

## Setup
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies (if not already done):
   ```bash
   npm install
   ```
3. Update the `.env` file with your PostgreSQL credentials:
   ```env
   DB_NAME=your_db_name
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_HOST=localhost
   DB_PORT=5432
   JWT_SECRET=your_super_secret_jwt_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints
- **POST** `/api/auth/register` - Register a new user
  - Body: `{ "username": "...", "email": "...", "password": "..." }`
