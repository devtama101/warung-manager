import { db, Inventory, Pesanan, getDeviceId } from '../db/schema';
import { syncManager } from './sync';

export type { Inventory };

// Add inventory
export async function addInventory(item: Omit<Inventory, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'deviceId'>): Promise<number> {
  const now = new Date();
  const deviceId = getDeviceId();

  const inventoryId = await db.inventory.add({
    ...item,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
    deviceId
  });

  // Add to sync queue
  await syncManager.addToQueue('CREATE', 'inventory', inventoryId, {
    ...item,
    createdAt: now,
    updatedAt: now
  });

  return inventoryId;
}

// Update stock
export async function updateStock(
  inventoryId: number,
  delta: number,
  reason: string = 'Manual adjustment'
): Promise<void> {
  const item = await db.inventory.get(inventoryId);
  if (!item) {
    throw new Error('Inventory item not found');
  }

  const newStock = item.stok + delta;
  if (newStock < 0) {
    throw new Error('Stock cannot be negative');
  }

  const now = new Date();
  await db.inventory.update(inventoryId, {
    stok: newStock,
    updatedAt: now,
    syncStatus: 'pending'
  });

  const updatedItem = await db.inventory.get(inventoryId);
  if (updatedItem) {
    await syncManager.addToQueue('UPDATE', 'inventory', inventoryId, updatedItem);
  }
}

// Get low stock items
export async function getLowStockItems(): Promise<Inventory[]> {
  const allItems = await db.inventory.toArray();
  return allItems.filter(item => item.stok < item.stokMinimum);
}

// Auto-deduct stock from order
export async function deductStockFromOrder(pesanan: Pesanan): Promise<void> {
  for (const orderItem of pesanan.items) {
    // Get menu item
    const menu = await db.menu.get(orderItem.menuId);
    if (!menu) continue;

    // Deduct stock for each ingredient
    for (const ingredient of menu.ingredients) {
      const qtyNeeded = ingredient.qty * orderItem.qty;
      try {
        await updateStock(ingredient.inventoryId, -qtyNeeded, `Order #${pesanan.id}`);
      } catch (error) {
        console.error(`Failed to deduct stock for ${ingredient.inventoryNama}:`, error);
        // Continue with other ingredients even if one fails
      }
    }
  }
}

// Get inventory by category
export async function getInventoryByCategory(kategori: 'bahan_baku' | 'kemasan' | 'lainnya'): Promise<Inventory[]> {
  return await db.inventory
    .where('kategori')
    .equals(kategori)
    .toArray();
}

// Get all inventory
export async function getAllInventory(): Promise<Inventory[]> {
  return await db.inventory.toArray();
}

// Get inventory by ID
export async function getInventoryById(inventoryId: number): Promise<Inventory | undefined> {
  return await db.inventory.get(inventoryId);
}

// Update inventory details
export async function updateInventory(inventoryId: number, updates: Partial<Inventory>): Promise<void> {
  const now = new Date();
  await db.inventory.update(inventoryId, {
    ...updates,
    updatedAt: now,
    syncStatus: 'pending'
  });

  const updatedItem = await db.inventory.get(inventoryId);
  if (updatedItem) {
    await syncManager.addToQueue('UPDATE', 'inventory', inventoryId, updatedItem);
  }
}

// Delete inventory
export async function deleteInventory(inventoryId: number): Promise<void> {
  await db.inventory.delete(inventoryId);
  await syncManager.addToQueue('DELETE', 'inventory', inventoryId, { id: inventoryId });
}
