# Warung Manager - Indonesian to English Refactoring Summary

## Completed Refactorings

### 1. Frontend IndexedDB Schema (`frontend/src/db/schema_current.ts`)

**Interfaces Renamed:**
- `Pesanan` → `Order`
- `PesananItem` → `OrderItem`
- `Menu` → `MenuItem`
- `Inventory` → `InventoryItem`
- `WarungPosDB` → `WarungManagerDB`

**Properties Renamed:**
- `nomorMeja` → `tableNumber`
- `tanggal` → `orderDate`
- `menuNama` → `menuName`
- `qty` → `quantity`
- `harga` → `price`
- `catatan` → `notes`
- `nama` → `name`
- `deskripsi` → `description`
- `kategori` → `category`
- `hargaModal` → `costPrice`
- `tersedia` → `available`
- `gambar` → `image`
- `inventoryNama` → `inventoryName`
- `stok` → `stock`
- `stokMinimum` → `minimumStock`
- `hargaBeli` → `purchasePrice`
- `tanggalBeli` → `purchaseDate`
- `tanggal` (DailyReport) → `reportDate`
- `totalPenjualan` → `totalSales`
- `totalPesanan` → `totalOrders`
- `totalModal` → `totalCost`
- `keuntungan` → `profit`
- `itemTerlaris` → `bestSellingItem`
- `warungNama` → `businessName`
- `warungAlamat` → `businessAddress`

**Category Values:**
- `makanan` → `food`
- `minuman` → `beverage`
- `bahan_baku` → `raw_material`
- `kemasan` → `packaging`
- `lainnya` → `other`

**Table Names in SyncQueue:**
- `pesanan` → `orders`
- `menu` → `menuItems`
- `inventory` → `inventoryItems`
- `dailyReport` → `dailyReports`

**Database Tables:**
- `pesanan` → `orders`
- `menu` → `menuItems`
- `inventory` → `inventoryItems`

### 2. Backend TypeScript Types (`backend/src/types.ts`)

**Context Variables:**
- `warungNama` → `businessName`

### 3. Backend PostgreSQL Schema (`backend/src/db/schema.ts`)

**Types:**
- `PesananItem` → `OrderItem`
  - `menuNama` → `menuName`
  - `qty` → `quantity`
  - `harga` → `price`
  - `catatan` → `notes`

- `MenuIngredient` (no change to interface name)
  - `inventoryNama` → `inventoryName`
  - `qty` → `quantity`

**Enums:**
- `kategoriMenuEnum` → `menuCategoryEnum`
  - Values: `makanan, minuman` → `food, beverage`
- `kategoriInventoryEnum` → `inventoryCategoryEnum`
  - Values: `bahan_baku, kemasan, lainnya` → `raw_material, packaging, other`

**Tables:**
- `users` table columns:
  - `warungNama` → `businessName` (column: `business_name`)
  - `warungAlamat` → `businessAddress` (column: `business_address`)

- `pesanan` → `orders`
  - `nomorMeja` → `tableNumber` (column: `table_number`)
  - `tanggal` → `orderDate` (column: `order_date`)

- `menu` → `menuItems` (table: `menu_items`)
  - `nama` → `name`
  - `kategori` → `category`
  - `harga` → `price`
  - `tersedia` → `available`
  - `gambar` → `image`

- `inventory` → `inventoryItems` (table: `inventory_items`)
  - `nama` → `name`
  - `kategori` → `category`
  - `stok` → `stock`
  - `stokMinimum` → `minimumStock` (column: `minimum_stock`)
  - `hargaBeli` → `purchasePrice` (column: `purchase_price`)
  - `tanggalBeli` → `purchaseDate` (column: `purchase_date`)

- `dailyReports` table:
  - `tanggal` → `reportDate` (column: `report_date`)
  - `totalPenjualan` → `totalSales` (column: `total_sales`)
  - `totalPesanan` → `totalOrders` (column: `total_orders`)
  - `totalModal` → `totalCost` (column: `total_cost`)
  - `keuntungan` → `profit`
  - `itemTerlaris` → `bestSellingItem` (column: `best_selling_item`)

- `inventoryEvents`:
  - `referenceType` comment: `'pesanan'` → `'orders'`

- `syncQueueV2`:
  - `entityType` comment: `'pesanan', 'menu', 'inventory'` → `'orders', 'menuItems', 'inventoryItems'`

### 4. Backend Main Server (`backend/src/index.ts`)

**Imports:**
- `pesanan` → `orders`
- `menu` → `menuItems`
- `inventory` → `inventoryItems`

**String Updates:**
- `'Warung POS API'` → `'Warung Manager API'`

**Valid Tables Array:**
- `['pesanan', 'menu', 'inventory', 'dailyReport']` → `['orders', 'menuItems', 'inventoryItems', 'dailyReports']`

**Switch Cases:**
- `case 'pesanan'` → `case 'orders'`
- `case 'menu'` → `case 'menuItems'`
- `case 'inventory'` → `case 'inventoryItems'`
- `case 'dailyReport'` → `case 'dailyReports'`

**Function Names:**
- `handlePesananSync` → `handleOrdersSync`
- `handleMenuSync` → `handleMenuItemsSync`
- `handleInventorySync` → `handleInventoryItemsSync`
- `handleDailyReportSync` → `handleDailyReportsSync`

**All Data Properties** in sync functions updated according to mappings above.

## Remaining Refactorings Needed

### 5. Backend Admin Routes (`backend/src/routes/admin.ts`)

**Imports to Update:**
```typescript
import { users, devices, orders, menuItems, inventoryItems, syncLogs, conflictLogs } from '../db/schema';
```

**All references to update:**
- `pesanan` → `orders` (variable and table references)
- `menu` → `menuItems`
- `inventory` → `inventoryItems`
- `warungNama` → `businessName`
- `warungAlamat` → `businessAddress`
- `tanggal` → `orderDate` (for orders)
- `nomorMeja` → `tableNumber`
- `menuNama` → `menuName`
- `totalPenjualan` → `totalSales`
- `totalPesanan` → `totalOrders`
- `totalModal` → `totalCost`
- `keuntungan` → `profit`
- `itemTerlaris` → `bestSellingItem`
- Entity types in conflict logs: `'pesanan'` → `'orders'`, `'menu'` → `'menuItems'`, `'inventory'` → `'inventoryItems'`

### 6. Frontend Lib Files

**frontend/src/lib/menu.ts:**
```typescript
import { db, MenuItem, getDeviceId } from '../db/schema';

export type { MenuItem };

// Update all function signatures
export async function addMenuItem(item: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'deviceId'>): Promise<number>

export async function getAllMenuItems(): Promise<MenuItem[]>

export async function getAvailableMenuItems(): Promise<MenuItem[]>

export async function getMenuItemsByCategory(category: 'food' | 'beverage' | 'snack'): Promise<MenuItem[]>

export async function getMenuItemById(menuId: number): Promise<MenuItem | undefined>

export async function updateMenuItem(menuId: number, updates: Partial<MenuItem>): Promise<void>

export async function toggleMenuItemAvailability(menuId: number): Promise<void>

export async function deleteMenuItem(menuId: number): Promise<void>

export async function searchMenuItems(query: string): Promise<MenuItem[]>

// Update all db.menu → db.menuItems
// Update all item.tersedia → item.available
// Update all item.nama → item.name
// Update sync queue table: 'menu' → 'menuItems'
```

**frontend/src/lib/orders.ts:**
```typescript
import { db, Order, OrderItem, getDeviceId } from '../db/schema';

export type { Order, OrderItem };

export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'deviceId'>): Promise<number>

export async function getTodayOrders(): Promise<Order[]>

export async function getOrdersByDateRange(startDate: Date, endDate: Date): Promise<Order[]>

export async function getOrdersByStatus(status: 'pending' | 'completed' | 'cancelled'): Promise<Order[]>

export async function updateOrderStatus(orderId: number, status: 'pending' | 'completed' | 'cancelled'): Promise<void>

export async function completeOrder(orderId: number): Promise<void>

export async function cancelOrder(orderId: number): Promise<void>

export async function getOrderById(orderId: number): Promise<Order | undefined>

export async function deleteOrder(orderId: number): Promise<void>

// Update all db.pesanan → db.orders
// Update all data.tanggal → data.orderDate
// Update sync queue table: 'pesanan' → 'orders'
```

**frontend/src/lib/inventory.ts:**
```typescript
import { db, InventoryItem, Order, getDeviceId } from '../db/schema';

export type { InventoryItem };

export async function addInventoryItem(item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'deviceId'>): Promise<number>

export async function updateStock(inventoryId: number, delta: number, reason: string = 'Manual adjustment'): Promise<void>

export async function getLowStockItems(): Promise<InventoryItem[]>

export async function deductStockFromOrder(order: Order): Promise<void>

export async function getInventoryItemsByCategory(category: 'raw_material' | 'packaging' | 'other'): Promise<InventoryItem[]>

export async function getAllInventoryItems(): Promise<InventoryItem[]>

export async function getInventoryItemById(inventoryId: number): Promise<InventoryItem | undefined>

export async function updateInventoryItem(inventoryId: number, updates: Partial<InventoryItem>): Promise<void>

export async function deleteInventoryItem(inventoryId: number): Promise<void>

// Update all db.inventory → db.inventoryItems
// Update all item.stok → item.stock
// Update all item.stokMinimum → item.minimumStock
// Update all item.nama → item.name
// Update all pesanan → order
// Update all db.menu → db.menuItems
// Update all ingredient.inventoryNama → ingredient.inventoryName
// Update sync queue table: 'inventory' → 'inventoryItems'
```

**frontend/src/lib/sync.ts:**
```typescript
// Update SyncQueue table type:
table: 'orders' | 'menuItems' | 'inventoryItems' | 'dailyReports';

// No other major changes needed as this file mostly handles API communication
```

**frontend/src/lib/reports.ts:**
```typescript
import { db, DailyReport, getDeviceId } from '../db/schema';

// Update all db.pesanan → db.orders
// Update all db.menu → db.menuItems
// Update all order.tanggal → order.orderDate
// Update all order.items properties: menuNama → menuName, qty → quantity, harga → price
// Update all menu properties: nama → name, harga → price, hargaModal → costPrice
// Update all report properties:
//   - tanggal → reportDate
//   - totalPenjualan → totalSales
//   - totalPesanan → totalOrders
//   - totalModal → totalCost
//   - keuntungan → profit
//   - itemTerlaris → bestSellingItem
// Update sync queue table: 'dailyReport' → 'dailyReports'
```

### 7. Frontend Components and Pages

**Search Pattern:** Use these Grep patterns to find all files that need updates:

```bash
# Find all TypeScript/TSX files using old names
grep -r "Pesanan" frontend/src/components frontend/src/pages
grep -r "PesananItem" frontend/src/components frontend/src/pages
grep -r "Menu[^I]" frontend/src/components frontend/src/pages  # Menu not MenuItem
grep -r "Inventory[^I]" frontend/src/components frontend/src/pages  # Inventory not InventoryItem
grep -r "nomorMeja" frontend/src/components frontend/src/pages
grep -r "menuNama" frontend/src/components frontend/src/pages
grep -r "\\bqty\\b" frontend/src/components frontend/src/pages
grep -r "\\bharga\\b" frontend/src/components frontend/src/pages
grep -r "\\bnama\\b" frontend/src/components frontend/src/pages
grep -r "kategori" frontend/src/components frontend/src/pages
grep -r "tersedia" frontend/src/components frontend/src/pages
grep -r "stok" frontend/src/components frontend/src/pages
grep -r "warungNama" frontend/src/components frontend/src/pages
grep -r "Warung POS" frontend/src/components frontend/src/pages
```

**Key Files to Update:**
- All components in `frontend/src/components/`
- All pages in `frontend/src/pages/`
- Update TypeScript type imports
- Update property accesses (keep UI labels in Indonesian)

**Example Pattern:**
```tsx
// OLD:
import { Pesanan, Menu } from '../db/schema';
const order: Pesanan = ...;
<div>{order.nomorMeja}</div>  // UI label: "Nomor Meja"
<div>{order.items[0].menuNama}</div>
<div>{order.items[0].qty}</div>

// NEW:
import { Order, MenuItem } from '../db/schema';
const order: Order = ...;
<div>{order.tableNumber}</div>  // UI label stays: "Nomor Meja"
<div>{order.items[0].menuName}</div>
<div>{order.items[0].quantity}</div>
```

### 8. Update "Warung POS" to "Warung Manager"

**Files to Update:**
```bash
grep -r "Warung POS" frontend/src/ backend/src/
```

**Update in:**
- Page titles
- Headers
- API service names
- Database names
- Documentation
- README files
- Package names

**Keep Indonesian UI Labels:**
- All user-facing text in components should remain in Indonesian
- Only change TypeScript code (types, properties, variable names)
- Only change "Warung POS" branding to "Warung Manager"

## Migration Notes

Since the user confirmed we can wipe all data:

1. **Drop and recreate PostgreSQL database:**
   ```bash
   npm run db:drop  # If script exists, or manually drop
   npm run db:push  # Will create new schema with English names
   ```

2. **Clear frontend IndexedDB:**
   - User should clear browser data or
   - Add a version bump in schema that triggers migration/clear

3. **No migration scripts needed** - confirmed by user

## Validation Checklist

After completing refactoring:

- [ ] Backend compiles without errors: `cd backend && npm run build`
- [ ] Frontend compiles without errors: `cd frontend && npm run build`
- [ ] All TypeScript types match between frontend and backend
- [ ] Database schema matches backend types
- [ ] Sync functionality works with new table/property names
- [ ] UI still displays Indonesian labels correctly
- [ ] All "Warung POS" changed to "Warung Manager"
- [ ] API endpoints accept new property names
- [ ] IndexedDB schema version updated

## Quick Reference Map

### Complete Property Mapping

| Indonesian | English | Notes |
|---|---|---|
| pesanan | orders | Table/Interface |
| nomorMeja | tableNumber | |
| tanggal | orderDate | For orders |
| tanggal | reportDate | For reports |
| menuNama | menuName | |
| qty | quantity | |
| harga | price | |
| catatan | notes | |
| menu | menuItems | Table/Interface |
| nama | name | |
| deskripsi | description | |
| kategori | category | |
| makanan | food | Category value |
| minuman | beverage | Category value |
| snack | snack | No change |
| harga | price | |
| hargaModal | costPrice | |
| tersedia | available | |
| gambar | image | |
| inventory | inventoryItems | Table/Interface |
| inventoryNama | inventoryName | |
| bahan_baku | raw_material | Category value |
| kemasan | packaging | Category value |
| lainnya | other | Category value |
| stok | stock | |
| stokMinimum | minimumStock | |
| hargaBeli | purchasePrice | |
| supplier | supplier | No change |
| tanggalBeli | purchaseDate | |
| totalPenjualan | totalSales | |
| totalPesanan | totalOrders | |
| totalModal | totalCost | |
| keuntungan | profit | |
| itemTerlaris | bestSellingItem | |
| warungNama | businessName | |
| warungAlamat | businessAddress | |
| WarungPosDB | WarungManagerDB | |
| Warung POS | Warung Manager | Branding |

## Recommended Approach

1. Complete backend refactoring first (admin.ts and other route files)
2. Run backend tests/compilation
3. Update all frontend lib files
4. Update frontend components and pages systematically
5. Test incrementally
6. Do final "Warung POS" → "Warung Manager" replacement
7. Wipe databases and test fresh setup

This refactoring maintains backward compatibility in UI language (Indonesian for users) while modernizing the codebase with English property names.
