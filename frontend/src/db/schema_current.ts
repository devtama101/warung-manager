import Dexie, { Table } from 'dexie';

// ============= INTERFACES =============

export interface Order {
  id?: number; // Auto-increment local ID
  serverId?: string; // ID from server after sync
  tableNumber?: string; // Table number (optional)
  items: OrderItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  orderDate: Date;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced' | 'conflict';
  deviceId: string;
  version?: number; // For optimistic locking
  lastModifiedBy?: string; // Device ID that last modified this record
}

export interface OrderItem {
  menuId: number;
  menuName: string;
  quantity: number;
  price: number;
  subtotal: number;
  notes?: string;
}

export interface MenuItem {
  id?: number;
  serverId?: string;
  name: string;
  description?: string;
  category: 'food' | 'beverage' | 'snack';
  price: number;
  costPrice: number;
  available: boolean;
  image?: string; // Base64 or URL
  ingredients: MenuIngredient[]; // Link to inventory
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced' | 'conflict';
  deviceId: string;
  version?: number; // For optimistic locking
  lastModifiedBy?: string; // Device ID that last modified this record
}

export interface MenuIngredient {
  inventoryId: number;
  inventoryName: string;
  quantity: number; // Quantity used per menu item
  unit: string; // kg, pcs, etc
}

export interface InventoryItem {
  id?: number;
  serverId?: string;
  name: string;
  category: 'raw_material' | 'packaging' | 'other';
  stock: number; // Current stock
  unit: string; // kg, liter, pcs, etc
  minimumStock: number; // Alert threshold
  purchasePrice: number; // Purchase price
  supplier?: string;
  purchaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced' | 'conflict';
  deviceId: string;
  version?: number; // For optimistic locking
  lastModifiedBy?: string; // Device ID that last modified this record
}

export interface DailyReport {
  id?: number;
  serverId?: string;
  reportDate: Date; // YYYY-MM-DD
  totalSales: number;
  totalOrders: number;
  totalCost: number; // Cost of goods sold
  profit: number; // Profit
  bestSellingItem: string; // Best-selling item
  createdAt: Date;
  syncStatus: 'pending' | 'synced' | 'conflict';
  deviceId: string;
  version?: number; // For optimistic locking
  lastModifiedBy?: string; // Device ID that last modified this record
}

export interface SyncQueue {
  id?: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  table: 'orders' | 'menuItems' | 'inventoryItems' | 'dailyReports';
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
  businessName: string;
  businessAddress?: string;
  userId?: string;
  authToken?: string;
  lastSyncAt?: Date;
  autoSyncEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============= DEXIE DATABASE =============

class WarungManagerDB extends Dexie {
  orders!: Table<Order>;
  menuItems!: Table<MenuItem>;
  inventoryItems!: Table<InventoryItem>;
  dailyReports!: Table<DailyReport>;
  syncQueue!: Table<SyncQueue>;
  settings!: Table<AppSettings>;

  constructor() {
    super('WarungManagerDB');

    // Define schema version 1
    this.version(1).stores({
      orders: '++id, serverId, orderDate, status, syncStatus, deviceId',
      menuItems: '++id, serverId, name, category, available, syncStatus, deviceId',
      inventoryItems: '++id, serverId, name, category, stock, syncStatus, deviceId',
      dailyReports: '++id, serverId, reportDate, syncStatus, deviceId',
      syncQueue: '++id, table, synced, timestamp',
      settings: '++id, deviceId'
    });
  }
}

export const db = new WarungManagerDB();

// ============= HELPER FUNCTIONS =============

// Initialize device
export async function initializeDevice(): Promise<string> {
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
      businessName: 'Warung Saya',
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

// Seed initial data
export async function seedInitialData(): Promise<void> {
  const deviceId = getDeviceId();

  // Check if already seeded
  const menuCount = await db.menuItems.count();
  if (menuCount > 0) return;

  const now = new Date();

  // Seed inventory
  await db.inventoryItems.bulkAdd([
    {
      name: 'Beras',
      category: 'raw_material',
      stock: 50,
      unit: 'kg',
      minimumStock: 10,
      purchasePrice: 12000,
      supplier: 'Toko Sumber Rejeki',
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deviceId
    },
    {
      name: 'Minyak Goreng',
      category: 'raw_material',
      stock: 20,
      unit: 'liter',
      minimumStock: 5,
      purchasePrice: 15000,
      supplier: 'Toko Sumber Rejeki',
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deviceId
    },
    {
      name: 'Ayam',
      category: 'raw_material',
      stock: 15,
      unit: 'kg',
      minimumStock: 3,
      purchasePrice: 35000,
      supplier: 'Pasar Segar',
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deviceId
    },
    {
      name: 'Telur',
      category: 'raw_material',
      stock: 100,
      unit: 'pcs',
      minimumStock: 20,
      purchasePrice: 2500,
      supplier: 'Pasar Segar',
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deviceId
    },
    {
      name: 'Teh Celup',
      category: 'raw_material',
      stock: 200,
      unit: 'pcs',
      minimumStock: 50,
      purchasePrice: 500,
      supplier: 'Toko Grosir',
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deviceId
    },
    {
      name: 'Gula Pasir',
      category: 'raw_material',
      stock: 10,
      unit: 'kg',
      minimumStock: 2,
      purchasePrice: 14000,
      supplier: 'Toko Grosir',
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deviceId
    }
  ]);

  // Get inventory IDs for menu ingredients
  const berasId = (await db.inventoryItems.where('name').equals('Beras').first())?.id || 1;
  const minyakId = (await db.inventoryItems.where('name').equals('Minyak Goreng').first())?.id || 2;
  const ayamId = (await db.inventoryItems.where('name').equals('Ayam').first())?.id || 3;
  const telurId = (await db.inventoryItems.where('name').equals('Telur').first())?.id || 4;
  const tehId = (await db.inventoryItems.where('name').equals('Teh Celup').first())?.id || 5;
  const gulaId = (await db.inventoryItems.where('name').equals('Gula Pasir').first())?.id || 6;

  // Seed menu
  await db.menuItems.bulkAdd([
    {
      name: 'Nasi Goreng',
      category: 'food',
      price: 15000,
      costPrice: 8000,
      available: true,
      ingredients: [
        { inventoryId: berasId, inventoryName: 'Beras', quantity: 0.15, unit: 'kg' },
        { inventoryId: minyakId, inventoryName: 'Minyak Goreng', quantity: 0.02, unit: 'liter' },
        { inventoryId: telurId, inventoryName: 'Telur', quantity: 1, unit: 'pcs' }
      ],
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deviceId
    },
    {
      name: 'Ayam Goreng',
      category: 'food',
      price: 20000,
      costPrice: 12000,
      available: true,
      ingredients: [
        { inventoryId: ayamId, inventoryName: 'Ayam', quantity: 0.25, unit: 'kg' },
        { inventoryId: minyakId, inventoryName: 'Minyak Goreng', quantity: 0.05, unit: 'liter' }
      ],
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deviceId
    },
    {
      name: 'Nasi Putih',
      category: 'food',
      price: 5000,
      costPrice: 2000,
      available: true,
      ingredients: [
        { inventoryId: berasId, inventoryName: 'Beras', quantity: 0.1, unit: 'kg' }
      ],
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deviceId
    },
    {
      name: 'Teh Manis',
      category: 'beverage',
      price: 3000,
      costPrice: 1000,
      available: true,
      ingredients: [
        { inventoryId: tehId, inventoryName: 'Teh Celup', quantity: 1, unit: 'pcs' },
        { inventoryId: gulaId, inventoryName: 'Gula Pasir', quantity: 0.02, unit: 'kg' }
      ],
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deviceId
    },
    {
      name: 'Es Teh Manis',
      category: 'beverage',
      price: 4000,
      costPrice: 1500,
      available: true,
      ingredients: [
        { inventoryId: tehId, inventoryName: 'Teh Celup', quantity: 1, unit: 'pcs' },
        { inventoryId: gulaId, inventoryName: 'Gula Pasir', quantity: 0.02, unit: 'kg' }
      ],
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deviceId
    }
  ]);
}
