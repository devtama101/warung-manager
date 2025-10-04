# Product Requirements Document (PRD)
## Warung POS - Offline-First Point of Sale System

**Version:** 1.0  
**Last Updated:** October 4, 2025  
**Status:** Ready for Development  
**Target Launch:** MVP in 6-8 weeks

---

## 1. Executive Summary

### 1.1 Product Vision
An offline-first Progressive Web App (PWA) designed for small Indonesian food vendors (warungs) to manage orders, track inventory, and generate daily reports—even without internet connectivity. The system syncs data to a central server when online, enabling multi-device access and backup.

### 1.2 Problem Statement
Small warungs in Indonesia face:
- Poor or unreliable internet connectivity
- Manual order tracking (pen & paper)
- Inventory waste due to lack of tracking
- No insights into daily profitability
- Inability to access data across multiple devices

### 1.3 Success Metrics (MVP)
- **Offline functionality:** 100% core features work without internet
- **Install rate:** PWA installable on Android devices
- **Sync success rate:** >95% when online
- **User adoption:** 10-20 beta testers (warung owners)
- **Performance:** App loads in <2 seconds

---

## 2. Technology Stack

### 2.1 Frontend (PWA - Client)
```
Base Framework:  Vite 6 + React 18 + TypeScript
UI Framework:    shadcn/ui (Tailwind CSS v4)
Local Database:  Dexie.js (IndexedDB wrapper)
PWA:             vite-plugin-pwa + Workbox
State:           Zustand (lightweight state management)
HTTP Client:     Axios (with offline queue)
Charts:          Recharts (for reports)
Date Library:    date-fns (lightweight)
Form Handling:   React Hook Form + Zod validation
```

### 2.2 Backend (Sync Server - VPS)
```
Framework:       Hono.js (fast, lightweight)
Database:        PostgreSQL 16
ORM:             Drizzle ORM (type-safe)
Authentication:  JWT (simple token-based)
Deployment:      Docker + Docker Compose
Reverse Proxy:   Nginx (optional)
```

### 2.3 Development Tools
```
Package Manager: npm or pnpm
Code Quality:    ESLint + Prettier
Version Control: Git
AI Assistant:    Claude Code (for development)
```

---

## 3. System Architecture

### 3.1 High-Level Architecture
```
┌─────────────────────────────────────────────────────┐
│               CLIENT DEVICES (Offline-First)         │
│                                                      │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │  Device 1 (HP)   │  │  Device 2 (Tab)  │        │
│  │                  │  │                  │        │
│  │  ┌────────────┐  │  │  ┌────────────┐  │        │
│  │  │ PWA App    │  │  │  │ PWA App    │  │        │
│  │  │            │  │  │  │            │  │        │
│  │  │ ┌────────┐ │  │  │  │ ┌────────┐ │  │        │
│  │  │ │ Dexie  │ │  │  │  │ │ Dexie  │ │  │        │
│  │  │ │IndexDB │ │  │  │  │ │IndexDB │ │  │        │
│  │  │ └────────┘ │  │  │  │ └────────┘ │  │        │
│  │  └──────┬─────┘  │  │  └──────┬─────┘  │        │
│  └─────────┼────────┘  └─────────┼────────┘        │
│            │                     │                  │
│            └──────────┬──────────┘                  │
└───────────────────────┼─────────────────────────────┘
                        │ Sync when online
                        │ (HTTP/REST API)
                        │
              ┌─────────▼──────────┐
              │   VPS SERVER       │
              │                    │
              │  ┌──────────────┐  │
              │  │  Hono.js API │  │
              │  │  (Port 3001) │  │
              │  └──────┬───────┘  │
              │         │          │
              │  ┌──────▼───────┐  │
              │  │ PostgreSQL   │  │
              │  │ (Port 5432)  │  │
              │  └──────────────┘  │
              └────────────────────┘
```

### 3.2 Data Flow

**Offline Operation:**
1. User interacts with PWA
2. Data saved to Dexie (IndexedDB)
3. Operations added to sync queue
4. App continues functioning

**Online Sync:**
1. App detects internet connection
2. Sync queue processes pending operations
3. POST data to backend API
4. Backend saves to PostgreSQL
5. Success → Mark as synced in Dexie
6. Conflict → Last-Write-Wins (LWW) resolution

**Multi-Device Access:**
1. User logs in from new device
2. App fetches latest data from server
3. Data saved to local Dexie
4. Continue offline-first operation

---

## 4. Database Schema

### 4.1 Frontend Schema (Dexie.js - IndexedDB)

```typescript
// db/schema.ts
import Dexie, { Table } from 'dexie';

// ============= INTERFACES =============

export interface Pesanan {
  id?: number; // Auto-increment local ID
  serverId?: string; // ID from server after sync
  nomorMeja?: string; // Table number (optional)
  items: PesananItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  tanggal: Date;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced' | 'conflict';
  deviceId: string;
}

export interface PesananItem {
  menuId: number;
  menuNama: string;
  qty: number;
  harga: number;
  subtotal: number;
  catatan?: string;
}

export interface Menu {
  id?: number;
  serverId?: string;
  nama: string;
  kategori: 'makanan' | 'minuman' | 'snack';
  harga: number;
  tersedia: boolean;
  gambar?: string; // Base64 or URL
  ingredients: MenuIngredient[]; // Link to inventory
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced' | 'conflict';
  deviceId: string;
}

export interface MenuIngredient {
  inventoryId: number;
  inventoryNama: string;
  qty: number; // Quantity used per menu item
  unit: string; // kg, pcs, etc
}

export interface Inventory {
  id?: number;
  serverId?: string;
  nama: string;
  kategori: 'bahan_baku' | 'kemasan' | 'lainnya';
  stok: number; // Current stock
  unit: string; // kg, liter, pcs, etc
  stokMinimum: number; // Alert threshold
  hargaBeli: number; // Purchase price
  supplier?: string;
  tanggalBeli?: Date;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced' | 'conflict';
  deviceId: string;
}

export interface DailyReport {
  id?: number;
  serverId?: string;
  tanggal: Date; // YYYY-MM-DD
  totalPenjualan: number;
  totalPesanan: number;
  totalModal: number; // Cost of goods sold
  keuntungan: number; // Profit
  itemTerlaris: string; // Best-selling item
  createdAt: Date;
  syncStatus: 'pending' | 'synced' | 'conflict';
  deviceId: string;
}

export interface SyncQueue {
  id?: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  table: 'pesanan' | 'menu' | 'inventory' | 'dailyReport';
  recordId: number; // Local record ID
  data: any; // JSON payload
  timestamp: number;
  synced: boolean;
  error?: string;
  retryCount: number;
}

export interface AppSettings {
  id?: number;
  deviceId: string;
  deviceName: string;
  warungNama: string;
  warungAlamat?: string;
  userId?: string;
  authToken?: string;
  lastSyncAt?: Date;
  autoSyncEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============= DEXIE DATABASE =============

class WarungPosDB extends Dexie {
  pesanan!: Table<Pesanan>;
  menu!: Table<Menu>;
  inventory!: Table<Inventory>;
  dailyReport!: Table<DailyReport>;
  syncQueue!: Table<SyncQueue>;
  settings!: Table<AppSettings>;

  constructor() {
    super('WarungPosDB');
    
    // Define schema version 1
    this.version(1).stores({
      pesanan: '++id, serverId, tanggal, status, syncStatus, deviceId',
      menu: '++id, serverId, nama, kategori, tersedia, syncStatus, deviceId',
      inventory: '++id, serverId, nama, kategori, stok, syncStatus, deviceId',
      dailyReport: '++id, serverId, tanggal, syncStatus, deviceId',
      syncQueue: '++id, table, synced, timestamp',
      settings: '++id, deviceId'
    });
  }
}

export const db = new WarungPosDB();

// ============= HELPER FUNCTIONS =============

// Initialize device
export async function initializeDevice() {
  let deviceId = localStorage.getItem('deviceId');
  
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('deviceId', deviceId);
  }
  
  const existingSettings = await db.settings.where('deviceId').equals(deviceId).first();
  
  if (!existingSettings) {
    await db.settings.add({
      deviceId,
      deviceName: `Device-${deviceId.slice(0, 8)}`,
      warungNama: 'Warung Saya',
      autoSyncEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  return deviceId;
}

// Get device ID
export function getDeviceId(): string {
  return localStorage.getItem('deviceId') || '';
}
```

### 4.2 Backend Schema (Drizzle ORM - PostgreSQL)

```typescript
// backend/db/schema.ts
import { pgTable, serial, text, integer, timestamp, boolean, json, decimal, pgEnum } from 'drizzle-orm/pg-core';

// ============= ENUMS =============

export const statusEnum = pgEnum('status', ['pending', 'completed', 'cancelled']);
export const kategoriMenuEnum = pgEnum('kategori_menu', ['makanan', 'minuman', 'snack']);
export const kategoriInventoryEnum = pgEnum('kategori_inventory', ['bahan_baku', 'kemasan', 'lainnya']);
export const syncActionEnum = pgEnum('sync_action', ['CREATE', 'UPDATE', 'DELETE']);

// ============= TABLES =============

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(), // Hashed
  warungNama: text('warung_nama').notNull(),
  warungAlamat: text('warung_alamat'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const devices = pgTable('devices', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  deviceId: text('device_id').notNull().unique(),
  deviceName: text('device_name').notNull(),
  lastSeenAt: timestamp('last_seen_at'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const pesanan = pgTable('pesanan', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  deviceId: text('device_id').references(() => devices.deviceId).notNull(),
  localId: integer('local_id'), // Original ID from client
  nomorMeja: text('nomor_meja'),
  items: json('items').$type<PesananItem[]>().notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  status: statusEnum('status').notNull().default('pending'),
  tanggal: timestamp('tanggal').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const menu = pgTable('menu', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  deviceId: text('device_id').references(() => devices.deviceId).notNull(),
  localId: integer('local_id'),
  nama: text('nama').notNull(),
  kategori: kategoriMenuEnum('kategori').notNull(),
  harga: decimal('harga', { precision: 10, scale: 2 }).notNull(),
  tersedia: boolean('tersedia').default(true).notNull(),
  gambar: text('gambar'),
  ingredients: json('ingredients').$type<MenuIngredient[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const inventory = pgTable('inventory', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  deviceId: text('device_id').references(() => devices.deviceId).notNull(),
  localId: integer('local_id'),
  nama: text('nama').notNull(),
  kategori: kategoriInventoryEnum('kategori').notNull(),
  stok: decimal('stok', { precision: 10, scale: 3 }).notNull(),
  unit: text('unit').notNull(),
  stokMinimum: decimal('stok_minimum', { precision: 10, scale: 3 }).notNull(),
  hargaBeli: decimal('harga_beli', { precision: 10, scale: 2 }).notNull(),
  supplier: text('supplier'),
  tanggalBeli: timestamp('tanggal_beli'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const dailyReports = pgTable('daily_reports', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  deviceId: text('device_id').references(() => devices.deviceId).notNull(),
  tanggal: timestamp('tanggal').notNull(),
  totalPenjualan: decimal('total_penjualan', { precision: 12, scale: 2 }).notNull(),
  totalPesanan: integer('total_pesanan').notNull(),
  totalModal: decimal('total_modal', { precision: 12, scale: 2 }).notNull(),
  keuntungan: decimal('keuntungan', { precision: 12, scale: 2 }).notNull(),
  itemTerlaris: text('item_terlaris'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const syncLogs = pgTable('sync_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  deviceId: text('device_id').references(() => devices.deviceId).notNull(),
  action: syncActionEnum('action').notNull(),
  table: text('table').notNull(),
  recordId: integer('record_id'),
  data: json('data'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  success: boolean('success').notNull(),
  error: text('error')
});

// ============= TYPES =============

export type PesananItem = {
  menuId: number;
  menuNama: string;
  qty: number;
  harga: number;
  subtotal: number;
  catatan?: string;
};

export type MenuIngredient = {
  inventoryId: number;
  inventoryNama: string;
  qty: number;
  unit: string;
};
```

---

## 5. Feature Specifications

### 5.1 Feature #1: Catat Pesanan (Order Management)

**Priority:** P0 (Critical)  
**Complexity:** Medium  
**Estimated Time:** 5-7 days

#### User Stories
- As a warung owner, I want to quickly record customer orders so I can track sales
- As a kasir, I want to see order history so I can reference past orders
- As a warung owner, I want to assign table numbers so I can track dine-in orders

#### Acceptance Criteria
1. User can create new order with multiple menu items
2. User can select menu items from a list (with search/filter)
3. User can adjust quantity for each item
4. User can add notes to items (e.g., "tanpa cabe")
5. User can assign optional table number
6. System auto-calculates total price
7. Order saves to Dexie immediately (offline-first)
8. Order added to sync queue when created
9. User can view list of today's orders
10. User can filter orders by status (pending/completed/cancelled)
11. User can mark order as completed
12. User can cancel order (with confirmation)
13. Completed orders automatically deduct inventory

#### UI Components (shadcn/ui)
```
Pages:
- /orders (Order List)
- /orders/new (Create Order)
- /orders/:id (Order Detail)

Components:
- OrderCard (displays order summary)
- MenuSelector (searchable menu list)
- OrderItemCard (individual item in order)
- OrderStatusBadge (status indicator)
- QuickActionButtons (Complete/Cancel)
```

#### Key Functions
```typescript
// Create order
async function createOrder(orderData: Omit<Pesanan, 'id'>): Promise<number>

// Get today's orders
async function getTodayOrders(): Promise<Pesanan[]>

// Update order status
async function updateOrderStatus(orderId: number, status: Status): Promise<void>

// Complete order (deduct inventory)
async function completeOrder(orderId: number): Promise<void>
```

#### Validation Rules
- Order must have at least 1 item
- Quantity must be > 0
- Total must be calculated correctly
- Status transitions: pending → completed/cancelled only

---

### 5.2 Feature #2: Track Inventory Bahan (Inventory Tracking)

**Priority:** P0 (Critical)  
**Complexity:** Medium-High  
**Estimated Time:** 6-8 days

#### User Stories
- As a warung owner, I want to track ingredient stock so I know when to reorder
- As a warung owner, I want low-stock alerts so I don't run out unexpectedly
- As a warung owner, I want to see stock deduction when orders are completed

#### Acceptance Criteria
1. User can add new inventory items with:
   - Name, category, current stock, unit, minimum threshold, purchase price
2. User can update stock (add/reduce manually)
3. System auto-deducts stock when order is completed
4. User sees low-stock alerts (when stock < minimum threshold)
5. User can view inventory list with search/filter
6. User can filter by category
7. User can edit inventory details
8. User can delete inventory (with confirmation)
9. Stock changes save to Dexie immediately
10. Sync queue tracks all inventory changes

#### UI Components
```
Pages:
- /inventory (Inventory List)
- /inventory/new (Add Inventory)
- /inventory/:id (Edit Inventory)
- /inventory/alerts (Low Stock Alerts)

Components:
- InventoryCard (displays item with stock indicator)
- StockBadge (color-coded: green/yellow/red)
- LowStockAlert (warning banner)
- StockAdjustmentForm (add/reduce stock)
- InventoryChart (stock trends - optional)
```

#### Key Functions
```typescript
// Add inventory
async function addInventory(item: Omit<Inventory, 'id'>): Promise<number>

// Update stock
async function updateStock(
  inventoryId: number, 
  delta: number, 
  reason: string
): Promise<void>

// Get low stock items
async function getLowStockItems(): Promise<Inventory[]>

// Auto-deduct stock from order
async function deductStockFromOrder(pesanan: Pesanan): Promise<void>

// Get inventory by category
async function getInventoryByCategory(
  kategori: string
): Promise<Inventory[]>
```

#### Stock Deduction Logic
```typescript
// When order is completed:
1. For each item in order:
   a. Find menu item
   b. Get menu ingredients
   c. For each ingredient:
      - Calculate qty needed (ingredient.qty * orderItem.qty)
      - Deduct from inventory.stok
   d. Save changes to Dexie
   e. Add to sync queue
2. Check for low-stock items
3. Show alert if any items below threshold
```

#### Validation Rules
- Stock cannot be negative
- Minimum threshold must be ≥ 0
- Purchase price must be > 0
- Unit is required
- Category is required

---

### 5.3 Feature #3: Laporan Harian (Daily Report with Charts)

**Priority:** P0 (Critical)  
**Complexity:** Medium  
**Estimated Time:** 5-6 days

#### User Stories
- As a warung owner, I want to see daily profit so I know business performance
- As a warung owner, I want to see sales trends so I can plan better
- As a warung owner, I want to know best-selling items so I can optimize menu

#### Acceptance Criteria
1. System auto-generates daily report at end of day (or on-demand)
2. Report shows:
   - Total sales (revenue)
   - Total orders count
   - Total cost (COGS)
   - Profit (revenue - cost)
   - Best-selling item
3. User can view report for today
4. User can view reports for past dates (date picker)
5. User can view 7-day trend chart (line/bar chart)
6. Chart shows daily profit trend
7. Chart shows daily order count trend
8. Report saves to Dexie
9. Report added to sync queue

#### UI Components
```
Pages:
- /reports (Daily Report Dashboard)
- /reports/history (Report History)

Components:
- ReportCard (summary cards for metrics)
- ProfitChart (line chart - Recharts)
- OrderTrendChart (bar chart - Recharts)
- BestSellerCard (displays top item)
- DateRangePicker (select date range)
```

#### Report Calculation Logic
```typescript
// Calculate daily report for a specific date
async function generateDailyReport(tanggal: Date): Promise<DailyReport> {
  // 1. Get all completed orders for the date
  const orders = await db.pesanan
    .where('tanggal').equals(tanggal)
    .and(p => p.status === 'completed')
    .toArray();
  
  // 2. Calculate total sales
  const totalPenjualan = orders.reduce((sum, o) => sum + o.total, 0);
  
  // 3. Calculate COGS (Cost of Goods Sold)
  let totalModal = 0;
  for (const order of orders) {
    for (const item of order.items) {
      // Get menu
      const menu = await db.menu.get(item.menuId);
      // Calculate cost from ingredients
      for (const ing of menu.ingredients) {
        const inventory = await db.inventory.get(ing.inventoryId);
        const cost = (ing.qty * item.qty) * inventory.hargaBeli;
        totalModal += cost;
      }
    }
  }
  
  // 4. Calculate profit
  const keuntungan = totalPenjualan - totalModal;
  
  // 5. Find best-seller
  const itemCounts = new Map<string, number>();
  orders.forEach(order => {
    order.items.forEach(item => {
      itemCounts.set(
        item.menuNama, 
        (itemCounts.get(item.menuNama) || 0) + item.qty
      );
    });
  });
  const itemTerlaris = [...itemCounts.entries()]
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  
  // 6. Save report
  return {
    tanggal,
    totalPenjualan,
    totalPesanan: orders.length,
    totalModal,
    keuntungan,
    itemTerlaris,
    createdAt: new Date(),
    syncStatus: 'pending',
    deviceId: getDeviceId()
  };
}
```

#### Key Functions
```typescript
// Generate report for today
async function generateTodayReport(): Promise<DailyReport>

// Get report by date
async function getReportByDate(date: Date): Promise<DailyReport | null>

// Get reports for date range
async function getReportsByDateRange(
  startDate: Date, 
  endDate: Date
): Promise<DailyReport[]>

// Get 7-day trend data
async function get7DayTrend(): Promise<ChartData[]>
```

#### Chart Data Format (Recharts)
```typescript
type ChartData = {
  date: string; // 'Oct 1'
  revenue: number;
  profit: number;
  orders: number;
};
```

---

### 5.4 Feature #4: Offline Mode (PWA + Sync)

**Priority:** P0 (Critical)  
**Complexity:** High  
**Estimated Time:** 7-10 days

#### User Stories
- As a warung owner, I want the app to work without internet so I can use it anywhere
- As a warung owner, I want data to sync automatically when online so I don't lose anything
- As a warung owner, I want to install the app on my phone so it feels like a native app

#### Acceptance Criteria
1. App is installable as PWA (Add to Home Screen)
2. App displays custom splash screen on launch
3. App works 100% offline for all core features:
   - Create orders
   - View orders
   - Update inventory
   - View reports
4. All offline changes are queued for sync
5. When online, sync queue auto-processes
6. User sees sync status indicator (syncing/synced/offline)
7. User can manually trigger sync
8. App caches all static assets (JS, CSS, images)
9. App shows offline indicator when no connection
10. Sync handles conflicts with Last-Write-Wins strategy

#### PWA Configuration
```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Warung POS',
        short_name: 'WarungPOS',
        description: 'Offline-First POS untuk Warung Makan',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.warungpos\.com\/.*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
});
```

#### Sync Queue Implementation
```typescript
// lib/sync.ts

interface SyncQueueItem {
  id?: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  table: string;
  recordId: number;
  data: any;
  timestamp: number;
  synced: boolean;
  error?: string;
  retryCount: number;
}

class SyncManager {
  private isSyncing = false;
  private maxRetries = 3;
  
  // Add item to sync queue
  async addToQueue(
    action: string,
    table: string,
    recordId: number,
    data: any
  ): Promise<void> {
    await db.syncQueue.add({
      action,
      table,
      recordId,
      data,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0
    });
  }
  
  // Process sync queue
  async processQueue(): Promise<void> {
    if (this.isSyncing) return;
    if (!navigator.onLine) return;
    
    this.isSyncing = true;
    
    try {
      const queue = await db.syncQueue
        .where('synced')
        .equals(false)
        .and(item => item.retryCount < this.maxRetries)
        .toArray();
      
      for (const item of queue) {
        try {
          await this.syncItem(item);
          await db.syncQueue.update(item.id!, { synced: true });
        } catch (error) {
          await db.syncQueue.update(item.id!, {
            retryCount: item.retryCount + 1,
            error: error.message
          });
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }
  
  // Sync individual item
  private async syncItem(item: SyncQueueItem): Promise<void> {
    const endpoint = `/api/sync/${item.table}`;
    const token = localStorage.getItem('authToken');
    
    await axios.post(endpoint, {
      action: item.action,
      recordId: item.recordId,
      data: item.data,
      timestamp: item.timestamp,
      deviceId: getDeviceId()
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  // Start auto-sync (listen to online event)
  startAutoSync(): void {
    window.addEventListener('online', () => {
      this.processQueue();
    });
    
    // Also sync every 5 minutes if online
    setInterval(() => {
      if (navigator.onLine) {
        this.processQueue();
      }
    }, 5 * 60 * 1000);
  }
}

export const syncManager = new SyncManager();
```

#### Offline Indicator Component
```typescript
// components/OfflineIndicator.tsx
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (isOnline) return null;
  
  return (
    <div className="fixed bottom-4 left-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg">
      <WifiOff className="inline mr-2" />
      Offline Mode
    </div>
  );
}
```

---

## 6. Backend API Specification

### 6.1 Authentication Endpoints

#### POST /api/auth/register
**Description:** Register new user  
**Request Body:**
```json
{
  "username": "owner123",
  "password": "securepassword",
  "warungNama": "Warung Pak Budi",
  "warungAlamat": "Jl. Merdeka No. 123"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "username": "owner123",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /api/auth/login
**Description:** User login  
**Request Body:**
```json
{
  "username": "owner123",
  "password": "securepassword",
  "deviceId": "uuid-device-id"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "username": "owner123",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "warungNama": "Warung Pak Budi"
  }
}
```

### 6.2 Sync Endpoints

#### POST /api/sync/pesanan
**Description:** Sync order data  
**Headers:** `Authorization: Bearer <token>`  
**Request Body:**
```json
{
  "action": "CREATE",
  "recordId": 123,
  "data": {
    "localId": 123,
    "nomorMeja": "5",
    "items": [...],
    "total": 50000,
    "status": "completed",
    "tanggal": "2025-10-04T10:30:00Z"
  },
  "timestamp": 1728041400000,
  "deviceId": "uuid-device-id"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "serverId": 456,
    "synced": true
  }
}
```

#### POST /api/sync/inventory
**Description:** Sync inventory data  
**Headers:** `Authorization: Bearer <token>`  
**Request Body:**
```json
{
  "action": "UPDATE",
  "recordId": 10,
  "data": {
    "localId": 10,
    "nama": "Beras",
    "stok": 45.5,
    "unit": "kg"
  },
  "timestamp": 1728041400000,
  "deviceId": "uuid-device-id"
}
```

#### POST /api/sync/menu
**Description:** Sync menu data

#### POST /api/sync/dailyReport
**Description:** Sync daily report data

### 6.3 Data Pull Endpoints

#### GET /api/data/latest
**Description:** Pull latest data from server for new device  
**Headers:** `Authorization: Bearer <token>`  
**Response:**
```json
{
  "success": true,
  "data": {
    "pesanan": [...],
    "menu": [...],
    "inventory": [...],
    "dailyReports": [...]
  }
}
```

#### GET /api/data/sync-status
**Description:** Check sync status  
**Headers:** `Authorization: Bearer <token>`  
**Response:**
```json
{
  "success": true,
  "data": {
    "lastSyncAt": "2025-10-04T12:00:00Z",
    "pendingSyncs": 5,
    "failedSyncs": 0
  }
}
```

---

## 7. Development Setup

### 7.1 Frontend Setup

```bash
# Step 1: Create PWA app
npm create @vite-pwa/pwa@latest warung-pos-frontend
# Choose: React + TypeScript + autoUpdate

cd warung-pos-frontend
npm install

# Step 2: Install dependencies
npm install dexie dexie-react-hooks
npm install axios
npm install zustand
npm install @tanstack/react-query
npm install date-fns
npm install react-hook-form zod @hookform/resolvers
npm install recharts

# Step 3: Install Tailwind + shadcn
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npx shadcn@latest init

# Step 4: Install shadcn components (as needed)
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add dialog
npx shadcn@latest add badge
npx shadcn@latest add table
npx shadcn@latest add tabs
npx shadcn@latest add calendar
npx shadcn@latest add alert

# Step 5: Configure Tailwind (tailwind.config.js)
# Add shadcn preset and configure content paths

# Step 6: Create folder structure
mkdir -p src/{components,pages,lib,hooks,db}
mkdir -p src/components/{ui,orders,inventory,reports}
```

### 7.2 Backend Setup

```bash
# Step 1: Create backend project
mkdir warung-pos-backend
cd warung-pos-backend
npm init -y

# Step 2: Install dependencies
npm install hono @hono/node-server
npm install drizzle-orm postgres
npm install jsonwebtoken bcrypt
npm install dotenv
npm install -D tsx drizzle-kit @types/node

# Step 3: Create folder structure
mkdir -p src/{routes,db,middleware,utils}
mkdir -p src/db/schema

# Step 4: Initialize Drizzle config
# Create drizzle.config.ts

# Step 5: Create .env file
# DATABASE_URL=postgresql://user:password@localhost:5432/warung_pos
# JWT_SECRET=your-secret-key
# PORT=3001

# Step 6: Setup database
docker-compose up -d postgres
npm run db:push
```

### 7.3 Docker Setup (VPS)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: warung-pos-db
    environment:
      POSTGRES_DB: warung_pos
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  api:
    build: ./backend
    container_name: warung-pos-api
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/warung_pos
      JWT_SECRET: ${JWT_SECRET}
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres_data:
```

---

## 8. File Structure

### 8.1 Frontend Structure
```
warung-pos-frontend/
├── public/
│   ├── icon-192x192.png
│   ├── icon-512x512.png
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn components
│   │   ├── orders/
│   │   │   ├── OrderCard.tsx
│   │   │   ├── OrderList.tsx
│   │   │   ├── CreateOrderForm.tsx
│   │   │   └── MenuSelector.tsx
│   │   ├── inventory/
│   │   │   ├── InventoryCard.tsx
│   │   │   ├── InventoryList.tsx
│   │   │   ├── StockAdjustment.tsx
│   │   │   └── LowStockAlert.tsx
│   │   ├── reports/
│   │   │   ├── DailyReport.tsx
│   │   │   ├── ProfitChart.tsx
│   │   │   └── TrendChart.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   └── OfflineIndicator.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Orders.tsx
│   │   ├── Inventory.tsx
│   │   ├── Reports.tsx
│   │   └── Settings.tsx
│   ├── db/
│   │   └── schema.ts              # Dexie schema
│   ├── lib/
│   │   ├── sync.ts                # Sync manager
│   │   ├── utils.ts
│   │   └── api.ts                 # Axios config
│   ├── hooks/
│   │   ├── useOrders.ts
│   │   ├── useInventory.ts
│   │   ├── useReports.ts
│   │   └── useSync.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### 8.2 Backend Structure
```
warung-pos-backend/
├── src/
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── sync.ts
│   │   └── data.ts
│   ├── db/
│   │   ├── index.ts               # DB connection
│   │   └── schema/
│   │       └── index.ts           # Drizzle schema
│   ├── middleware/
│   │   ├── auth.ts                # JWT verification
│   │   └── errorHandler.ts
│   ├── utils/
│   │   ├── jwt.ts
│   │   └── bcrypt.ts
│   └── index.ts                   # Hono app entry
├── drizzle.config.ts
├── .env.example
├── tsconfig.json
└── package.json
```

---

## 9. Development Workflow

### 9.1 Development Phases

**Phase 1: Foundation (Week 1-2)**
- Day 1-2: Setup frontend + backend projects
- Day 3-4: Implement Dexie schema + basic CRUD
- Day 5-7: Setup PWA configuration + offline mode
- Day 8-10: Implement auth + sync queue basics
- Day 11-14: Testing offline functionality

**Phase 2: Core Features (Week 3-4)**
- Day 15-19: Feature #1 - Catat Pesanan (complete)
- Day 20-25: Feature #2 - Track Inventory (complete)
- Day 26-30: Feature #3 - Laporan Harian (complete)

**Phase 3: Backend + Sync (Week 5)**
- Day 31-33: Backend API implementation
- Day 34-35: Sync implementation + testing
- Day 36-37: Multi-device testing

**Phase 4: Polish + Testing (Week 6)**
- Day 38-40: UI/UX improvements
- Day 41-42: Bug fixes + optimization
- Day 43-45: User testing with beta users

**Phase 5: Deployment (Week 7-8)**
- Day 46-48: VPS setup + Docker deployment
- Day 49-50: Production testing
- Day 51-52: Documentation + training materials
- Day 53-56: Beta launch + monitoring

### 9.2 Git Workflow

```bash
# Branch naming
main                    # Production-ready code
develop                 # Development branch
feature/catat-pesanan   # Feature branches
feature/inventory
feature/reports
bugfix/sync-issue       # Bug fix branches

# Commit message format
feat: add order creation form
fix: resolve sync queue retry logic
docs: update API documentation
style: format code with Prettier
refactor: simplify inventory deduction logic
test: add unit tests for sync manager
```

### 9.3 Code Quality Standards

**TypeScript:**
- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Explicit return types for functions
- Interface over type when possible

**React:**
- Functional components only
- Use hooks (useState, useEffect, custom hooks)
- Proper dependency arrays in useEffect
- Memoization for expensive computations (useMemo, useCallback)

**Naming Conventions:**
- Components: PascalCase (`OrderCard.tsx`)
- Functions: camelCase (`createOrder`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- Files: kebab-case for pages (`order-detail.tsx`)

**ESLint Rules:**
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests
```typescript
// Example: Test sync queue logic
import { describe, it, expect } from 'vitest';
import { SyncManager } from '@/lib/sync';

describe('SyncManager', () => {
  it('should add item to queue', async () => {
    const manager = new SyncManager();
    await manager.addToQueue('CREATE', 'pesanan', 1, { data: 'test' });
    const queue = await db.syncQueue.toArray();
    expect(queue).toHaveLength(1);
    expect(queue[0].synced).toBe(false);
  });
});
```

### 10.2 Integration Tests
- Test offline → online sync flow
- Test multi-device sync
- Test conflict resolution

### 10.3 E2E Tests (Optional)
- Use Playwright or Cypress
- Test critical user flows:
  - Create order → complete → check inventory deduction
  - Add inventory → create order → check report

### 10.4 Manual Testing Checklist
```
□ Install PWA on Android device
□ Create order while offline
□ Go online → verify sync
□ Login from second device → verify data pull
□ Complete order → verify inventory deduction
□ View daily report → verify calculations
□ Test with poor/intermittent connection
□ Test sync conflict scenarios
```

---

## 11. Deployment Guide

### 11.1 VPS Requirements
- OS: Ubuntu 22.04 LTS
- RAM: 2GB minimum (4GB recommended)
- Storage: 20GB SSD
- Docker + Docker Compose installed
- Domain with SSL (optional but recommended)

### 11.2 Deployment Steps

```bash
# 1. SSH to VPS
ssh user@your-vps-ip

# 2. Clone repository
git clone https://github.com/yourusername/warung-pos.git
cd warung-pos

# 3. Setup environment
cp .env.example .env
nano .env  # Edit with production values

# 4. Build frontend
cd frontend
npm install
npm run build
# Deploy dist/ to CDN or serve via Nginx

# 5. Start backend + database
cd ../backend
docker-compose up -d

# 6. Run migrations
docker-compose exec api npm run db:push

# 7. Check logs
docker-compose logs -f
```

### 11.3 Nginx Configuration (Optional)
```nginx
# /etc/nginx/sites-available/warung-pos
server {
    listen 80;
    server_name api.warungpos.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend (if serving via Nginx)
server {
    listen 80;
    server_name warungpos.com;
    root /var/www/warung-pos/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 12. Monitoring & Maintenance

### 12.1 Health Checks
```typescript
// Backend health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### 12.2 Logging
- Use structured logging (JSON format)
- Log levels: ERROR, WARN, INFO, DEBUG
- Log sync errors for troubleshooting
- Monitor database connection issues

### 12.3 Backup Strategy
```bash
# Daily PostgreSQL backup (cron job)
0 2 * * * docker exec warung-pos-db pg_dump -U postgres warung_pos > /backups/warung_pos_$(date +\%Y\%m\%d).sql
```

### 12.4 Update Strategy
- Zero-downtime deployments
- Database migrations via Drizzle Kit
- PWA auto-update for frontend

---

## 13. Future Enhancements (Post-MVP)

### Phase 2 Features (After MVP Launch)
1. **GoFood/GrabFood Integration**
   - API integration with delivery platforms
   - Sync external orders to POS

2. **Supplier Ordering**
   - Direct ordering from suppliers
   - Purchase order management

3. **Multi-Warung Support**
   - Franchise/chain management
   - Consolidated reporting

4. **Advanced Analytics**
   - Sales forecasting
   - Seasonal trend analysis
   - Customer behavior insights

5. **Receipt Printing**
   - Bluetooth printer integration
   - PDF receipt generation

6. **Employee Management**
   - Staff accounts with roles
   - Shift tracking
   - Commission calculation

7. **Customer Management**
   - Loyalty program
   - Customer database
   - Order history per customer

---

## 14. Success Criteria & KPIs

### MVP Launch Criteria
- ✅ All 4 core features functional
- ✅ Offline mode works flawlessly
- ✅ Sync success rate >95%
- ✅ PWA installable on Android
- ✅ 10+ beta users testing
- ✅ Zero critical bugs
- ✅ Documentation complete

### Post-Launch KPIs (Month 1-3)
- Active users: 50-100 warungs
- Daily active rate: >70%
- Sync errors: <5% of transactions
- App crashes: <1% of sessions
- User satisfaction: >4/5 stars
- Feature adoption: >80% use all 4 core features

---

## 15. Risk Mitigation

### Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| IndexedDB quota exceeded | High | Medium | Implement data cleanup, warn users |
| Sync conflicts | Medium | Medium | Last-Write-Wins + manual resolution UI |
| PWA not installing | High | Low | Test on multiple Android devices |
| VPS downtime | Medium | Low | Use reliable provider, setup monitoring |

### Business Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Users don't adopt | High | Medium | Focus on ease of use, provide training |
| Price point too high | Medium | Medium | Start with free tier, add premium later |
| Competition | Medium | High | Focus on offline-first USP |

---

## 16. Appendix

### 16.1 Glossary
- **PWA:** Progressive Web App
- **Dexie:** IndexedDB wrapper library
- **Sync Queue:** Local queue of unsynced changes
- **LWW:** Last-Write-Wins (conflict resolution)
- **COGS:** Cost of Goods Sold

### 16.2 References
- Dexie.js Documentation: https://dexie.org/
- Vite PWA Plugin: https://vite-pwa-org.netlify.app/
- Hono.js Documentation: https://hono.dev/
- Drizzle ORM: https://orm.drizzle.team/
- shadcn/ui: https://ui.shadcn.com/

### 16.3 Contact
- Developer: [Your Name]
- Project Repository: [GitHub URL]
- Support: [Email/WhatsApp]

---

**END OF PRD**

*This document is a living document and will be updated as the project evolves.*
