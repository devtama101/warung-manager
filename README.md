# Warung POS - Offline-First Point of Sale System

An offline-first Progressive Web App (PWA) designed for small Indonesian food vendors (warungs) to manage orders, track inventory, and generate daily reports—even without internet connectivity.

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

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL 16 (or Docker for local development)

### 1. Frontend Setup

```bash
cd frontend
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The frontend will be available at `http://localhost:5173`

### 2. Backend Setup

```bash
cd backend
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL=postgresql://postgres:password@localhost:5432/warung_pos
# JWT_SECRET=your-secret-key
# PORT=3001

# Start development server
npm run dev

# Build for production
npm run build

# Run production
npm start
```

The backend API will be available at `http://localhost:3001`

### 3. Database Setup with Docker

If you don't have PostgreSQL installed, use Docker:

```bash
# Start PostgreSQL only
docker-compose up postgres -d

# Or start both API and PostgreSQL
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Run Database Migrations

```bash
cd backend

# Generate migration files
npm run db:generate

# Push schema to database
npm run db:push
```

## Usage

### First Time Setup

1. Open the app at `http://localhost:5173`
2. The app will automatically:
   - Initialize a unique device ID
   - Create initial settings
   - Seed sample data (menu items and inventory)

### Creating an Order

1. Navigate to "Pesanan" (Orders)
2. Click "Buat Pesanan" (Create Order)
3. Select menu items from the list
4. Optionally add a table number
5. Review the order summary
6. Click "Buat Pesanan" to create

### Managing Inventory

1. Navigate to "Inventory"
2. View current stock levels
3. Filter by category (Bahan Baku, Kemasan, Lainnya)
4. See low-stock alerts
5. Stock is automatically deducted when orders are completed

### Viewing Reports

1. Navigate to "Laporan" (Reports)
2. View today's summary (revenue, profit, orders)
3. See 7-day trend charts
4. Check best-selling items
5. Click "Refresh Data" to regenerate reports

## Offline Functionality

The app works 100% offline:

- All data is stored locally in IndexedDB
- Changes are queued for sync
- When online, sync happens automatically
- Offline indicator shows connection status
- Service worker caches all assets

## Data Sync

When the device comes online:

- Pending changes are automatically synced to the server
- Failed syncs are retried up to 3 times
- Sync status is visible in the UI
- Manual sync can be triggered

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

## Sample Data

The app comes with sample data for testing:

**Inventory Items:**
- Beras (50 kg)
- Minyak Goreng (20 L)
- Ayam (15 kg)
- Telur (100 pcs)
- Teh Celup (200 pcs)
- Gula Pasir (10 kg)

**Menu Items:**
- Nasi Goreng (Rp 15,000)
- Ayam Goreng (Rp 20,000)
- Nasi Putih (Rp 5,000)
- Teh Manis (Rp 3,000)
- Es Teh Manis (Rp 4,000)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (Android, iOS)

## PWA Installation

On mobile devices:
1. Open the app in browser
2. Tap "Add to Home Screen"
3. The app installs as a standalone app
4. Use like a native app

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
- Check API_URL in `frontend/.env`
- Verify backend is running
- Check browser console for errors

## Contributing

This is a private project for warung management. For contributions or issues, please contact the project maintainer.

## License

ISC

## Support

For questions or support, please contact the development team.

---

**Built with ❤️ for Indonesian warungs**
