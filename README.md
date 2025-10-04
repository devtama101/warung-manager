# Warung POS - Offline-First Point of Sale System

An offline-first Progressive Web App (PWA) designed for small Indonesian food vendors (warungs) to manage orders, track inventory, and generate daily reports—even without internet connectivity.

## 📖 Documentation

**[📚 Documentation Index](./DOCS_INDEX.md)** - Complete guide to all documentation

### User Guides
- **[Admin Guide](./ADMIN_GUIDE.md)** - Panduan lengkap untuk pemilik warung/admin
- **[Employee Guide](./EMPLOYEE_GUIDE.md)** - Panduan lengkap untuk karyawan/kasir

### Setup Guides
- **[Quick Start](./QUICKSTART.md)** - Get running in 5 minutes
- **[Setup Guide](./SETUP.md)** - Detailed setup instructions
- **[Admin Integration](./ADMIN_INTEGRATION.md)** - Backend API documentation

## Features

### ✅ Completed Core Features

1. **Order Management (Catat Pesanan)**
   - Create and manage customer orders
   - Support for table numbers
   - Real-time order tracking
   - Order status management (pending, completed, cancelled)
   - Automatic inventory deduction on order completion

2. **Inventory Tracking**
   - Track ingredients and supplies
   - Low-stock alerts
   - Automatic stock deduction from orders
   - Support for multiple categories (bahan baku, kemasan, lainnya)
   - Supplier management

3. **Daily Reports with Charts**
   - Revenue and profit tracking
   - Visual trend charts (7-day trends)
   - Best-selling items analysis
   - Profit margin calculations
   - Cost of Goods Sold (COGS) tracking

4. **Offline-First PWA**
   - 100% functionality without internet
   - Automatic sync when online
   - Service worker caching
   - Installable on mobile devices

## Tech Stack

### Frontend (PWA)
- **Framework:** Vite 6 + React 18 + TypeScript
- **UI:** Tailwind CSS v4 + Custom Components
- **Local Database:** Dexie.js (IndexedDB wrapper)
- **PWA:** vite-plugin-pwa + Workbox
- **State:** Zustand
- **Charts:** Recharts
- **Date Library:** date-fns
- **Routing:** React Router v6
- **Icons:** Lucide React

### Backend (Sync Server)
- **Framework:** Hono.js (lightweight, fast)
- **Database:** PostgreSQL 16
- **ORM:** Drizzle ORM (type-safe)
- **Authentication:** JWT
- **Deployment:** Docker + Docker Compose

## Project Structure

```
warung-manager/
├── frontend/                 # PWA Client Application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ui/          # Base UI components
│   │   │   ├── layout/      # Layout components
│   │   │   ├── orders/      # Order components
│   │   │   ├── inventory/   # Inventory components
│   │   │   └── reports/     # Report components
│   │   ├── pages/           # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Orders.tsx
│   │   │   ├── NewOrder.tsx
│   │   │   ├── Inventory.tsx
│   │   │   └── Reports.tsx
│   │   ├── db/              # Dexie database
│   │   │   └── schema.ts    # IndexedDB schema
│   │   ├── lib/             # Business logic
│   │   │   ├── orders.ts
│   │   │   ├── inventory.ts
│   │   │   ├── menu.ts
│   │   │   ├── reports.ts
│   │   │   ├── sync.ts      # Sync manager
│   │   │   └── utils.ts
│   │   └── App.tsx
│   ├── public/              # Static assets
│   ├── vite.config.ts       # Vite + PWA config
│   └── package.json
│
├── backend/                 # API Server
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.ts    # Drizzle schema
│   │   │   └── index.ts     # DB connection
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Middleware
│   │   └── index.ts         # Hono server
│   ├── drizzle.config.ts
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml       # Docker setup
└── WARUNG_POS_PRD.md       # Product Requirements
```

## Getting Started

### Quick Links

- **[Quick Start Guide](./QUICKSTART.md)** - Get running in 5 minutes
- **[Setup Guide](./SETUP.md)** - Detailed setup instructions
- **[Admin Integration Guide](./ADMIN_INTEGRATION.md)** - Backend API documentation

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL 16 (or Docker for local development)

### Quick Setup

```bash
# 1. Start Database (Docker)
docker-compose up postgres -d

# 2. Start Backend
cd backend
npm install
npm run db:push
npm run dev

# 3. Start Frontend (new terminal)
cd frontend
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`
- Admin: `http://localhost:5173/admin/login`

For detailed setup, see [SETUP.md](./SETUP.md)

## Usage

For detailed usage instructions, please refer to:
- **[Admin Guide](./ADMIN_GUIDE.md)** - Complete guide for warung owners/admins
- **[Employee Guide](./EMPLOYEE_GUIDE.md)** - Complete guide for cashiers/employees

### Quick Start

1. **Admin Setup:**
   - Login at `/admin/login`
   - Add employees/devices via Devices page
   - Configure menu items with ingredients
   - Add inventory items

2. **Employee Usage:**
   - Login at `/login` with credentials from admin
   - Create orders via Orders page
   - Monitor stock status
   - Generate daily reports at end of shift

3. **Offline-First:**
   - All data stored locally in IndexedDB
   - Works 100% offline
   - Auto-syncs every 5 minutes when online
   - Changes queued for sync when offline

## Development

### Running Tests

```bash
# Frontend
cd frontend
npm test

# Backend
cd backend
npm test
```

### Code Quality

```bash
# Lint frontend
cd frontend
npm run lint

# Format code
npm run format
```

## Deployment

### Frontend Deployment (Netlify/Vercel)

```bash
cd frontend
npm run build

# Deploy the 'dist' folder
```

### Backend Deployment (VPS)

1. Clone repository to VPS
2. Set environment variables
3. Run Docker Compose:

```bash
cp .env.example .env
# Edit .env with production values

docker-compose up -d
```

### Database Migrations

```bash
# On VPS
docker-compose exec api npm run db:push
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Sync Endpoints
- `POST /api/sync/pesanan` - Sync order data
- `POST /api/sync/inventory` - Sync inventory data
- `POST /api/sync/menu` - Sync menu data
- `POST /api/sync/dailyReport` - Sync daily reports

### Data Endpoints
- `GET /api/data/latest` - Pull latest data
- `GET /api/data/sync-status` - Check sync status

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (Android, iOS)

## Troubleshooting

### Frontend won't start
- Check Node.js version (should be 20+)
- Delete `node_modules` and `package-lock.json`, then `npm install`
- Check port 5173 is not in use

### Backend connection errors
- Verify PostgreSQL is running
- Check DATABASE_URL in `.env`
- Ensure port 3001 is available

### Sync not working
- Check API_URL in `frontend/.env` (should be `http://localhost:3001`)
- Verify backend is running
- Check browser console for errors
- See troubleshooting sections in [Admin Guide](./ADMIN_GUIDE.md) and [Employee Guide](./EMPLOYEE_GUIDE.md)

## Contributing

This is a private project for warung management. For contributions or issues, please contact the project maintainer.

## License

ISC

## Database Tables Overview

### Employee/Kasir Tables (Local - IndexedDB)
| Table | Purpose | Auto-Sync |
|-------|---------|-----------|
| `pesanan` | Customer orders with items and totals | ✅ Every 5 min |
| `menu` | Available menu items with prices | ✅ Every 5 min |
| `inventory` | Raw materials/ingredients stock | ✅ Every 5 min |
| `dailyReport` | End-of-day sales summary | ✅ Every 5 min |
| `syncQueue` | Pending sync operations | - |
| `settings` | Local device settings | - |

### Admin Tables (Server - PostgreSQL)
| Table | Purpose | Managed By |
|-------|---------|------------|
| `users` | Warung owners/admins | Admin |
| `employees` | Karyawan/kasir accounts | Admin |
| `devices` | Registered devices/kasir | Admin |
| `pesanan` | All synced orders | Auto-sync |
| `menu` | All synced menu items | Auto-sync |
| `inventory` | All synced inventory | Auto-sync |
| `daily_reports` | All synced daily reports | Auto-sync |
| `sync_logs` | Audit trail of all sync ops | Auto-sync |

### Key Features

**Inventory Auto-Deduction:**
- When order status = "Completed" → Stock auto-deducts based on menu recipes
- Requires menu items to have `ingredients` field populated
- Calculates COGS for profit reporting

**Daily Reports:**
- Generated manually via "Buat Laporan Harian" button
- Calculates: Total Sales, COGS, Profit, Best Seller
- Auto-syncs to server for admin review

**Data Sync:**
- Employee devices sync every 5 minutes automatically
- All data saved locally first (works offline)
- Admin can review/delete synced data via Sync Management page

## Support

For questions or support, please contact the development team.

---

**Built with ❤️ for Indonesian warungs**
