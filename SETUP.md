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

- **Employee/Kasir Login**: http://localhost:5173/login
- **Warung Registration**: http://localhost:5173/register
- **Admin Dashboard**: http://localhost:5173/admin/login

## First Time Setup

### Register Your Warung (Owner)

1. Open http://localhost:5173/register
2. Fill in the registration form:
   - **Email**: Your email (will be used for login)
   - **Password**: Strong password (min 6 characters)
   - **Warung Name**: Your business name
   - **Warung Address**: Your business address (optional)
3. Click "Daftar" (Register)
4. You'll be automatically logged in and redirected to the dashboard

### Add Employee/Kasir (via Admin)

1. Login to admin dashboard at http://localhost:5173/admin/login
2. Go to "Perangkat" (Devices) menu
3. Click "+ Tambah Perangkat"
4. Fill in employee details:
   - Email (for employee login)
   - Password
   - Employee name
   - Device name
5. System generates unique Device ID automatically
6. Employee can now login at http://localhost:5173/login

### Employee Login

Employees login at http://localhost:5173/login with credentials provided by admin

## Features

### Authentication System
- **Warung Owner**: Register and manage warung
- **Employees**: Email/password login per device
- **Admin**: Separate admin dashboard with analytics
- Secure JWT-based authentication

### Employee Dashboard (Kasir)
- Dashboard overview with today's stats
- Create and manage orders
- Stock status monitoring
- Inventory viewing (read-only)
- Generate daily reports
- Auto-sync to server (every 5 minutes)

### Admin Dashboard
- Manage devices/employees
- Menu management with ingredients/recipes
- Inventory management
- Revenue analytics across all warungs
- **Sync Management** - Review and delete synced data
- Daily reports viewing
- System settings

For complete feature documentation, see:
- [Employee Guide](./EMPLOYEE_GUIDE.md)
- [Admin Guide](./ADMIN_GUIDE.md)

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
