import { pgTable, serial, text, integer, timestamp, boolean, json, decimal, pgEnum } from 'drizzle-orm/pg-core';

// ============= ENUMS =============

export const roleEnum = pgEnum('role', ['admin', 'employee']);
export const statusEnum = pgEnum('status', ['pending', 'completed', 'cancelled']);
export const kategoriMenuEnum = pgEnum('kategori_menu', ['makanan', 'minuman', 'snack']);
export const kategoriInventoryEnum = pgEnum('kategori_inventory', ['bahan_baku', 'kemasan', 'lainnya']);
export const syncActionEnum = pgEnum('sync_action', ['CREATE', 'UPDATE', 'DELETE']);

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

// ============= TABLES =============

// Admin/Owner table - pemilik warung
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // Hashed
  role: roleEnum('role').notNull().default('admin'),
  warungNama: text('warung_nama').notNull(),
  warungAlamat: text('warung_alamat'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Employee table - karyawan per-device
export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(), // Owner warung
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // Hashed
  name: text('name').notNull(), // Nama lengkap karyawan
  deviceId: text('device_id').notNull().unique(), // 1 employee = 1 device
  deviceName: text('device_name').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastSeenAt: timestamp('last_seen_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Devices table (legacy - for admin/owner devices tracking)
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
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  version: integer('version').default(1).notNull(),
  lastModifiedBy: text('last_modified_by').notNull()
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
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  version: integer('version').default(1).notNull(),
  lastModifiedBy: text('last_modified_by').notNull()
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
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  version: integer('version').default(1).notNull(),
  lastModifiedBy: text('last_modified_by').notNull()
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  version: integer('version').default(1).notNull(),
  lastModifiedBy: text('last_modified_by').notNull()
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

// Inventory Events Table (Event Sourcing for Inventory)
export const inventoryEvents = pgTable('inventory_events', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  inventoryId: integer('inventory_id').references(() => inventory.id).notNull(),
  eventType: text('event_type').notNull(), // 'STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'INITIAL'
  quantity: decimal('quantity', { precision: 10, scale: 3 }).notNull(),
  unit: text('unit').notNull(),
  reason: text('reason'), // e.g., 'Purchase', 'Sale', 'Waste', 'Adjustment'
  referenceType: text('reference_type'), // 'pesanan', 'purchase', 'manual_adjustment'
  referenceId: integer('reference_id'), // ID of related record
  deviceId: text('device_id').references(() => devices.deviceId).notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  syncedAt: timestamp('synced_at'),
  version: integer('version').default(1).notNull()
});

// Inventory Snapshots (for periodic stock verification)
export const inventorySnapshots = pgTable('inventory_snapshots', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  inventoryId: integer('inventory_id').references(() => inventory.id).notNull(),
  stockLevel: decimal('stock_level', { precision: 10, scale: 3 }).notNull(),
  unit: text('unit').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  deviceId: text('device_id').references(() => devices.deviceId).notNull(),
  verifiedBy: text('verified_by').notNull(), // Who performed the verification
  notes: text('notes')
});

// Enhanced Sync Queue (for better sync management)
export const syncQueueV2 = pgTable('sync_queue_v2', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  deviceId: text('device_id').references(() => devices.deviceId).notNull(),
  entityType: text('entity_type').notNull(), // 'pesanan', 'menu', 'inventory', etc.
  entityId: integer('entity_id').notNull(),
  action: syncActionEnum('action').notNull(),
  data: json('data').notNull(),
  priority: integer('priority').default(1).notNull(), // 1=low, 2=medium, 3=high
  retryCount: integer('retry_count').default(0).notNull(),
  maxRetries: integer('max_retries').default(5).notNull(),
  nextRetryAt: timestamp('next_retry_at'),
  status: text('status').default('pending').notNull(), // 'pending', 'processing', 'completed', 'failed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
  error: text('error')
});

// Conflict Resolution Logs
export const conflictLogs = pgTable('conflict_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  deviceId: text('device_id').references(() => devices.deviceId).notNull(),
  entityType: text('entity_type').notNull(),
  entityId: integer('entity_id').notNull(),
  conflictType: text('conflict_type').notNull(), // 'VERSION_MISMATCH', 'DATA_CONFLICT', 'DELETE_CONFLICT'
  clientData: json('client_data').notNull(),
  serverData: json('server_data').notNull(),
  resolvedData: json('resolved_data'),
  resolution: text('resolution').notNull(), // 'SERVER_WINS', 'CLIENT_WINS', 'MANUAL_MERGE', 'PENDING'
  resolvedBy: text('resolved_by'), // 'system', 'admin', userId
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
  notes: text('notes')
});
