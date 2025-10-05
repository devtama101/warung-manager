# Warung POS - Offline-First Point of Sale System

An enterprise-grade offline-first Progressive Web App (PWA) with advanced conflict resolution and optimistic locking, designed for small Indonesian food vendors (warungs) to manage orders, track inventory, and generate daily reports—built for multi-device environments with robust data integrity guarantees.

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
   - Create and manage customer orders with version tracking
   - Support for table numbers
   - Real-time order tracking
   - Order status management (pending, completed, cancelled)
   - Automatic inventory deduction on order completion
   - **Multi-device sync with conflict prevention**

2. **Inventory Tracking with Event Sourcing**
   - Track ingredients and supplies with complete audit trail
   - Low-stock alerts
   - Automatic stock deduction from orders
   - Support for multiple categories (bahan baku, kemasan, lainnya)
   - Supplier management
   - **Event-based inventory tracking** - every stock change logged
   - **Stock snapshots** for periodic verification

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

### 🔧 Advanced Architecture Features (NEW)

5. **Optimistic Locking System**
   - Prevents data loss in multi-device environments
   - Version-based conflict detection
   - Automatic server-authority conflict resolution
   - Full audit trail of all changes

6. **Conflict Resolution Management**
   - Visual conflict comparison interface
   - Admin-controlled resolution strategies
   - Manual merge capabilities
   - Conflict analytics and statistics

7. **Event Sourcing for Inventory**
   - Complete history of all inventory movements
   - Reversible operations
   - Stock transaction tracking (STOCK_IN, STOCK_OUT, ADJUSTMENT)
   - Reference tracking (pesanan, purchase, manual)

8. **Enhanced Sync System**
   - Version-aware synchronization
   - Retry mechanisms with exponential backoff
   - Priority-based sync queue
   - Comprehensive sync logging

## Tech Stack

### Frontend (PWA)
- **Framework:** Vite 6 + React 18 + TypeScript
- **UI:** Tailwind CSS v4 + Shadcn/ui Components
- **Local Database:** Dexie.js (IndexedDB wrapper) with version tracking
- **PWA:** vite-plugin-pwa + Workbox
- **State:** Context API + Local State
- **Charts:** Recharts
- **Date Library:** date-fns
- **Routing:** React Router v6
- **Icons:** Lucide React
- **Conflict Resolution:** Custom version-aware sync system

### Backend (Sync Server)
- **Framework:** Hono.js (lightweight, fast)
- **Database:** PostgreSQL 16 with advanced schema
- **ORM:** Drizzle ORM (type-safe) with optimistic locking
- **Authentication:** JWT with role-based access control
- **Conflict Resolution:** Version-based system with audit trails
- **Event Sourcing:** Inventory events tracking
- **Sync Management:** Priority queue with retry mechanisms
- **Deployment:** Docker + Docker Compose

### Advanced Architecture Components
- **Optimistic Locking:** Version-based conflict prevention
- **Event Sourcing:** Complete audit trail for inventory
- **Conflict Resolution:** Admin-controlled resolution system
- **Multi-device Support:** Concurrent operation handling
- **Data Integrity:** Server-authority with client reconciliation

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

**For New Installations:**
```bash
# On VPS
docker-compose exec api npm run db:push
```

**For Existing Installations (Migration Required):**
```bash
# Apply version fields and conflict resolution tables
docker-compose exec api psql -U postgres -d warung_pos -f migrations/001_add_version_fields.sql

# Or run via application (recommended)
docker-compose exec api npm run db:migrate
```

**Migration Script Location:** `backend/migrations/001_add_version_fields.sql`

**What Migration Does:**
- Adds `version` and `lastModifiedBy` fields to all data tables
- Creates conflict resolution tables (`conflict_logs`, `inventory_events`, etc.)
- Adds indexes for performance optimization
- Preserves all existing data

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Sync Endpoints (Enhanced with Optimistic Locking)
- `POST /api/sync/pesanan` - Sync order data with version checking
- `POST /api/sync/inventory` - Sync inventory data with event sourcing
- `POST /api/sync/menu` - Sync menu data with conflict prevention
- `POST /api/sync/dailyReport` - Sync daily reports with version tracking

### Data Endpoints
- `GET /api/data/latest` - Pull latest data
- `GET /api/data/sync-status` - Check sync status

### Conflict Resolution Endpoints (NEW)
- `GET /api/admin/conflicts` - List all conflicts with filtering
- `GET /api/admin/conflicts/user/:userId` - Get conflicts for specific user
- `POST /api/admin/conflicts/:conflictId/resolve` - Resolve conflict (SERVER_WINS/CLIENT_WINS/MANUAL_MERGE)
- `GET /api/admin/conflicts/stats` - Conflict analytics and statistics

### Admin Management
- `GET /api/admin/users` - List all warung users
- `GET /api/admin/devices` - Device management
- `GET /api/admin/revenue` - Revenue analytics with conflict-aware data

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
| Table | Purpose | Auto-Sync | Features |
|-------|---------|-----------|----------|
| `pesanan` | Customer orders with items and totals | ✅ Version-aware | Optimistic locking |
| `menu` | Available menu items with prices | ✅ Version-aware | Conflict prevention |
| `inventory` | Raw materials/ingredients stock | ✅ Version-aware | Event tracking |
| `dailyReport` | End-of-day sales summary | ✅ Version-aware | Protected updates |
| `syncQueue` | Pending sync operations | - | Priority queue |
| `settings` | Local device settings | - | Device-specific |

### Admin Tables (Server - PostgreSQL)
| Table | Purpose | Features |
|-------|---------|----------|
| `users` | Warung owners/admins | Role-based access |
| `employees` | Karyawan/kasir accounts | Device-bound authentication |
| `devices` | Registered devices/kasir | Multi-device support |
| `pesanan` | All synced orders | **Version + conflict tracking** |
| `menu` | All synced menu items | **Version + conflict tracking** |
| `inventory` | All synced inventory | **Version + conflict tracking** |
| `daily_reports` | All synced daily reports | **Version + conflict tracking** |
| `sync_logs` | Audit trail of all sync ops | Enhanced logging |
| `conflict_logs` | **NEW** - Conflict resolution tracking | Full audit trail |
| `inventory_events` | **NEW** - Event sourcing for inventory | Complete history |
| `inventory_snapshots` | **NEW** - Stock verification | Periodic snapshots |
| `sync_queue_v2` | **NEW** - Enhanced sync management | Priority + retry |

### Key Features

**Optimistic Locking:**
- Version fields on all data tables prevent concurrent overwrites
- Automatic conflict detection and resolution
- Server-authority with client reconciliation
- Full audit trail of all conflicts

**Event Sourcing (Inventory):**
- Every stock change creates an immutable event
- Complete history: STOCK_IN, STOCK_OUT, ADJUSTMENT, INITIAL
- Reference tracking to related records (orders, purchases)
- Stock level reconstruction from event history

**Conflict Resolution:**
- Visual comparison of client vs server data
- Admin-controlled resolution strategies
- Manual merge capabilities
- Conflict analytics and statistics

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
