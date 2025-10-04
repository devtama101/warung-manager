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
  deskripsi?: string;
  kategori: 'makanan' | 'minuman' | 'snack';
  harga: number;
  hargaModal: number;
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

// Seed initial data
export async function seedInitialData(): Promise<void> {
  const deviceId = getDeviceId();

  // Check if already seeded
  const menuCount = await db.menu.count();
  if (menuCount > 0) return;

  const now = new Date();

  // Seed inventory
  await db.inventory.bulkAdd([
    {
      nama: 'Beras',
      kategori: 'bahan_baku',
      stok: 50,
      unit: 'kg',
      stokMinimum: 10,
      hargaBeli: 12000,
      supplier: 'Toko Sumber Rejeki',
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deviceId
    },
    {
      nama: 'Minyak Goreng',
      kategori: 'bahan_baku',
      stok: 20,
      unit: 'liter',
      stokMinimum: 5,
      hargaBeli: 15000,
      supplier: 'Toko Sumber Rejeki',
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deviceId
    },
    {
      nama: 'Ayam',
      kategori: 'bahan_baku',
      stok: 15,
      unit: 'kg',
      stokMinimum: 3,
      hargaBeli: 35000,
      supplier: 'Pasar Segar',
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deviceId
    },
    {
      nama: 'Telur',
      kategori: 'bahan_baku',
      stok: 100,
      unit: 'pcs',
      stokMinimum: 20,
      hargaBeli: 2500,
      supplier: 'Pasar Segar',
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deviceId
    },
    {
      nama: 'Teh Celup',
      kategori: 'bahan_baku',
      stok: 200,
      unit: 'pcs',
      stokMinimum: 50,
      hargaBeli: 500,
      supplier: 'Toko Grosir',
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deviceId
    },
    {
      nama: 'Gula Pasir',
      kategori: 'bahan_baku',
      stok: 10,
      unit: 'kg',
      stokMinimum: 2,
      hargaBeli: 14000,
      supplier: 'Toko Grosir',
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deviceId
    }
  ]);

  // Get inventory IDs for menu ingredients
  const berasId = (await db.inventory.where('nama').equals('Beras').first())?.id || 1;
  const minyakId = (await db.inventory.where('nama').equals('Minyak Goreng').first())?.id || 2;
  const ayamId = (await db.inventory.where('nama').equals('Ayam').first())?.id || 3;
  const telurId = (await db.inventory.where('nama').equals('Telur').first())?.id || 4;
  const tehId = (await db.inventory.where('nama').equals('Teh Celup').first())?.id || 5;
  const gulaId = (await db.inventory.where('nama').equals('Gula Pasir').first())?.id || 6;

  // Seed menu
  await db.menu.bulkAdd([
    {
      nama: 'Nasi Goreng',
      kategori: 'makanan',
      harga: 15000,
      tersedia: true,
      ingredients: [
        { inventoryId: berasId, inventoryNama: 'Beras', qty: 0.15, unit: 'kg' },
        { inventoryId: minyakId, inventoryNama: 'Minyak Goreng', qty: 0.02, unit: 'liter' },
        { inventoryId: telurId, inventoryNama: 'Telur', qty: 1, unit: 'pcs' }
      ],
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deviceId
    },
    {
      nama: 'Ayam Goreng',
      kategori: 'makanan',
      harga: 20000,
      tersedia: true,
      ingredients: [
        { inventoryId: ayamId, inventoryNama: 'Ayam', qty: 0.25, unit: 'kg' },
        { inventoryId: minyakId, inventoryNama: 'Minyak Goreng', qty: 0.05, unit: 'liter' }
      ],
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deviceId
    },
    {
      nama: 'Nasi Putih',
      kategori: 'makanan',
      harga: 5000,
      tersedia: true,
      ingredients: [
        { inventoryId: berasId, inventoryNama: 'Beras', qty: 0.1, unit: 'kg' }
      ],
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deviceId
    },
    {
      nama: 'Teh Manis',
      kategori: 'minuman',
      harga: 3000,
      tersedia: true,
      ingredients: [
        { inventoryId: tehId, inventoryNama: 'Teh Celup', qty: 1, unit: 'pcs' },
        { inventoryId: gulaId, inventoryNama: 'Gula Pasir', qty: 0.02, unit: 'kg' }
      ],
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deviceId
    },
    {
      nama: 'Es Teh Manis',
      kategori: 'minuman',
      harga: 4000,
      tersedia: true,
      ingredients: [
        { inventoryId: tehId, inventoryNama: 'Teh Celup', qty: 1, unit: 'pcs' },
        { inventoryId: gulaId, inventoryNama: 'Gula Pasir', qty: 0.02, unit: 'kg' }
      ],
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deviceId
    }
  ]);
}
