import { db, MenuItem, getDeviceId } from '../db/schema';
import { syncManager } from './sync';

export type { MenuItem };

// Add menu item
export async function addMenuItem(item: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'deviceId'>): Promise<number> {
  const now = new Date();
  const deviceId = getDeviceId();

  const menuId = await db.menuItems.add({
    ...item,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
    deviceId
  });

  // Add to sync queue
  await syncManager.addToQueue('CREATE', 'menuItems', menuId, {
    ...item,
    createdAt: now,
    updatedAt: now
  });

  return menuId;
}

// Get all menu items
export async function getAllMenuItems(): Promise<MenuItem[]> {
  return await db.menuItems.toArray();
}

// Get available menu items
export async function getAvailableMenuItems(): Promise<MenuItem[]> {
  const allMenuItems = await db.menuItems.toArray();
  return allMenuItems.filter(item => item.available === true);
}

// Get menu by category
export async function getMenuItemsByCategory(category: 'food' | 'beverage' | 'snack'): Promise<MenuItem[]> {
  return await db.menuItems
    .where('category')
    .equals(category)
    .toArray();
}

// Get menu by ID
export async function getMenuItemById(menuId: number): Promise<MenuItem | undefined> {
  return await db.menuItems.get(menuId);
}

// Update menu
export async function updateMenuItem(menuId: number, updates: Partial<MenuItem>): Promise<void> {
  const now = new Date();
  await db.menuItems.update(menuId, {
    ...updates,
    updatedAt: now,
    syncStatus: 'pending'
  });

  const updatedItem = await db.menuItems.get(menuId);
  if (updatedItem) {
    await syncManager.addToQueue('UPDATE', 'menuItems', menuId, updatedItem);
  }
}

// Toggle menu availability
export async function toggleMenuItemAvailability(menuId: number): Promise<void> {
  const menuItem = await db.menuItems.get(menuId);
  if (!menuItem) {
    throw new Error('Menu item not found');
  }

  await updateMenuItem(menuId, { available: !menuItem.available });
}

// Delete menu
export async function deleteMenuItem(menuId: number): Promise<void> {
  await db.menuItems.delete(menuId);
  await syncManager.addToQueue('DELETE', 'menuItems', menuId, { id: menuId });
}

// Search menu by name
export async function searchMenuItems(query: string): Promise<MenuItem[]> {
  const allMenuItems = await db.menuItems.toArray();
  const lowerQuery = query.toLowerCase();
  return allMenuItems.filter(item =>
    item.name.toLowerCase().includes(lowerQuery)
  );
}
