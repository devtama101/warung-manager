# Quick Start Guide - Warung POS

Get up and running in 5 minutes!

## Option 1: Frontend Only (Offline Mode)

Perfect for testing or single-device use without backend sync.

```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Start the app
npm run dev

# 3. Open browser
# Go to http://localhost:5173
```

That's it! The app will work completely offline with local IndexedDB storage.

## Option 2: Full Stack (Frontend + Backend)

For multi-device sync and full features.

### Terminal 1: Start Database

```bash
# Start PostgreSQL with Docker
docker-compose up postgres -d
```

### Terminal 2: Start Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend runs on `http://localhost:3001`

### Terminal 3: Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## First Steps in the App

### For Admin:
1. **Register** at `/register` or login at `/admin/login`
2. **Add Employees**: Go to "Perangkat" → Click "+ Tambah Perangkat"
3. **Setup Menu**: Add menu items with ingredients
4. **Setup Inventory**: Add raw materials/stock

### For Employee/Kasir:
1. **Login** at `/login` with credentials from admin
2. **Dashboard**: See today's summary
3. **Create Order**:
   - Click "Pesanan" → "Buat Pesanan Baru"
   - Select menu items
   - Click "Buat Pesanan"
4. **Complete Order**:
   - Go to "Pesanan"
   - Click "Selesaikan" on pending order
   - Stock auto-deducted based on recipe
5. **View Reports**:
   - Go to "Laporan"
   - Click "Buat Laporan Harian" at end of shift

## Detailed Guides

- **[Employee Guide](./EMPLOYEE_GUIDE.md)** - Complete guide for cashiers
- **[Admin Guide](./ADMIN_GUIDE.md)** - Complete guide for owners/admins

## Testing Offline Mode

1. Start the app (it works online or offline)
2. Open DevTools → Network tab
3. Set to "Offline"
4. Create orders, update inventory
5. Everything still works!
6. Go back online → data syncs automatically

## Next Steps

- **[Setup Guide](./SETUP.md)** - Detailed setup instructions
- **[Admin Integration](./ADMIN_INTEGRATION.md)** - Backend API documentation
- **[README.md](./README.md)** - Technical documentation
- **[WARUNG_POS_PRD.md](./WARUNG_POS_PRD.md)** - Product requirements

## Need Help?

Common issues:
- **Port already in use**: Stop other apps on ports 5173 or 3001
- **Database error**: Make sure Docker is running and PostgreSQL is started
- **Sync not working**: Check `.env` file has correct API URL
- **Install fails**: Use Node.js 20+ and latest npm

See troubleshooting in [Employee Guide](./EMPLOYEE_GUIDE.md) and [Admin Guide](./ADMIN_GUIDE.md)

Enjoy your Warung POS! 🍜
