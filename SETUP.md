# Warung POS Setup Guide

## Prerequisites
- PostgreSQL installed and running
- Node.js v18+ installed
- npm or yarn package manager

## Quick Start

### 1. Setup Database

Create the PostgreSQL database:
```bash
psql -U postgres
CREATE DATABASE warung_pos;
\q
```

### 2. Configure Backend

Navigate to backend directory and install dependencies:
```bash
cd backend
npm install
```

The `.env` file is already configured for local PostgreSQL without password:
```
DATABASE_URL=postgresql://postgres@localhost:5432/warung_pos
JWT_SECRET=warung-pos-secret-key-development
PORT=3001
NODE_ENV=development
```

Push the database schema:
```bash
npm run db:push
```

### 3. Configure Frontend

Navigate to frontend directory and install dependencies:
```bash
cd frontend
npm install
```

The `.env` file is already configured:
```
VITE_API_URL=http://localhost:3001
```

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Access the Application

- **Warung Dashboard**: http://localhost:5173
- **Admin Dashboard**: http://localhost:5173/admin/login

## First Time Setup

### Register Your Warung

1. Open http://localhost:5173
2. You'll be redirected to the login page
3. Click "Register here"
4. Fill in the registration form:
   - **Username**: Your unique username (min 3 characters)
   - **Warung Name**: Your business name
   - **Warung Address**: Your business address (optional)
   - **Password**: Strong password (min 6 characters)
5. Click "Register"
6. You'll be automatically logged in and redirected to the dashboard

### Admin Access

For admin dashboard access (to view all warungs and revenue):
1. Go to http://localhost:5173/admin/login
2. Use demo credentials:
   - **Email**: admin@warungpos.com
   - **Password**: admin123

## Features

### Warung Authentication
- Each warung has its own account
- Multi-device support per warung
- Secure JWT-based authentication
- Password reveal buttons on all password fields

### Operational Dashboard (Per-Warung)
- Dashboard overview
- Orders management
- Menu management
- Inventory tracking
- Reports and analytics

### Admin Dashboard (Cross-Warung)
- View all registered warungs
- Revenue analytics across all warungs
- User management
- System settings

## Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - Warung accounts
- `devices` - Registered devices per warung
- `pesanan` - Orders
- `menu` - Menu items
- `inventory` - Inventory items
- `daily_reports` - Daily sales reports
- `sync_logs` - Synchronization logs

## Troubleshooting

### Database Connection Issues

If you see "ECONNREFUSED" errors:
1. Ensure PostgreSQL is running
2. Check your database credentials in `backend/.env`
3. Verify the database exists: `psql -U postgres -l`

### Registration Failed

If registration fails:
1. Check backend logs for detailed error messages
2. Verify database schema is pushed: `npm run db:push`
3. Check browser console for API errors

### Port Already in Use

If ports 3001 or 5173 are already in use:
- Backend: Change `PORT` in `backend/.env`
- Frontend: Change port in `frontend/vite.config.ts`

## Docker Setup (Alternative)

You can also use Docker to run the entire stack:

```bash
docker compose up -d
```

This will start:
- PostgreSQL on port 5432
- Backend API on port 3001

Then run the frontend separately:
```bash
cd frontend
npm run dev
```

## Development Notes

- Backend uses Hono framework for API
- Frontend uses React + Vite + TypeScript
- Database ORM: Drizzle ORM
- Offline-first with IndexedDB (Dexie.js)
- Real-time sync between local and server database
