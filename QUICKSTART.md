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

1. **Dashboard**: See today's summary
2. **Create Order**:
   - Click "Buat Pesanan Baru"
   - Select menu items
   - Click "Buat Pesanan"
3. **Complete Order**:
   - Go to "Pesanan"
   - Click "Selesai" on an order
   - Stock is automatically deducted
4. **View Reports**:
   - Go to "Laporan"
   - See charts and profit analysis

## Sample Data Included

The app comes with:
- 6 inventory items
- 5 menu items
- Ready to create orders immediately

## Testing Offline Mode

1. Start the app (it works online or offline)
2. Open DevTools → Network tab
3. Set to "Offline"
4. Create orders, update inventory
5. Everything still works!
6. Go back online → data syncs automatically

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check [WARUNG_POS_PRD.md](./WARUNG_POS_PRD.md) for complete feature specs
- Deploy to production (instructions in README)

## Need Help?

Common issues:
- **Port already in use**: Stop other apps on ports 5173 or 3001
- **Database error**: Make sure Docker is running and PostgreSQL is started
- **Install fails**: Use Node.js 20+ and latest npm

Enjoy your Warung POS! 🍜
