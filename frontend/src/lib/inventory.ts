import { db, InventoryItem, Order, getDeviceId } from '../db/schema';
import { syncManager } from './sync';

export type { InventoryItem };

// Add inventory
export async function addInventoryItem(item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'deviceId'>): Promise<number> {
  const now = new Date();
  const deviceId = getDeviceId();

  const inventoryId = await db.inventoryItems.add({
    ...item,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
    deviceId
  });

  // Add to sync queue
  await syncManager.addToQueue('CREATE', 'inventoryItems', inventoryId, {
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
  const item = await db.inventoryItems.get(inventoryId);
  if (!item) {
    throw new Error('Inventory item not found');
  }

  const newStock = item.stock + delta;
  if (newStock < 0) {
    throw new Error('Stock cannot be negative');
  }

  const now = new Date();
  await db.inventoryItems.update(inventoryId, {
    stock: newStock,
    updatedAt: now,
    syncStatus: 'pending'
  });

  const updatedItem = await db.inventoryItems.get(inventoryId);
  if (updatedItem) {
    await syncManager.addToQueue('UPDATE', 'inventoryItems', inventoryId, updatedItem);
  }
}

// Get low stock items
export async function getLowStockItems(): Promise<InventoryItem[]> {
  const allItems = await db.inventoryItems.toArray();
  return allItems.filter(item => item.stock < item.minimumStock);
}

// Auto-deduct stock from order
export async function deductStockFromOrder(order: Order): Promise<void> {
  for (const orderItem of order.items) {
    // Get menu item
    const menuItem = await db.menuItems.get(orderItem.menuId);
    if (!menuItem) continue;

    // Deduct stock for each ingredient
    for (const ingredient of menuItem.ingredients) {
      const qtyNeeded = ingredient.quantity * orderItem.quantity;
      try {
        await updateStock(ingredient.inventoryId, -qtyNeeded, `Order #${order.id}`);
      } catch (error) {
        console.error(`Failed to deduct stock for ${ingredient.inventoryName}:`, error);
        // Continue with other ingredients even if one fails
      }
    }
  }
}

// Get inventory by category
export async function getInventoryItemsByCategory(category: 'raw_material' | 'packaging' | 'other'): Promise<InventoryItem[]> {
  return await db.inventoryItems
    .where('category')
    .equals(category)
    .toArray();
}

// Get all inventory
export async function getAllInventoryItems(): Promise<InventoryItem[]> {
  return await db.inventoryItems.toArray();
}

// Get inventory by ID
export async function getInventoryItemById(inventoryId: number): Promise<InventoryItem | undefined> {
  return await db.inventoryItems.get(inventoryId);
}

// Update inventory details
export async function updateInventoryItem(inventoryId: number, updates: Partial<InventoryItem>): Promise<void> {
  const now = new Date();
  await db.inventoryItems.update(inventoryId, {
    ...updates,
    updatedAt: now,
    syncStatus: 'pending'
  });

  const updatedItem = await db.inventoryItems.get(inventoryId);
  if (updatedItem) {
    await syncManager.addToQueue('UPDATE', 'inventoryItems', inventoryId, updatedItem);
  }
}

// Delete inventory
export async function deleteInventoryItem(inventoryId: number): Promise<void> {
  await db.inventoryItems.delete(inventoryId);
  await syncManager.addToQueue('DELETE', 'inventoryItems', inventoryId, { id: inventoryId });
}
