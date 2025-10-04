import { pgTable, serial, text, integer, timestamp, boolean, json, decimal, pgEnum } from 'drizzle-orm/pg-core';

// ============= ENUMS =============

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
