import { db, Menu, getDeviceId } from '../db/schema';
import { syncManager } from './sync';

export type { Menu };

// Add menu item
export async function addMenu(item: Omit<Menu, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'deviceId'>): Promise<number> {
  const now = new Date();
  const deviceId = getDeviceId();

  const menuId = await db.menu.add({
    ...item,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
    deviceId
  });

  // Add to sync queue
  await syncManager.addToQueue('CREATE', 'menu', menuId, {
    ...item,
    createdAt: now,
    updatedAt: now
  });

  return menuId;
}

// Get all menu items
export async function getAllMenu(): Promise<Menu[]> {
  return await db.menu.toArray();
}

// Get available menu items
export async function getAvailableMenu(): Promise<Menu[]> {
  const allMenu = await db.menu.toArray();
  return allMenu.filter(item => item.tersedia === true);
}

// Get menu by category
export async function getMenuByCategory(kategori: 'makanan' | 'minuman' | 'snack'): Promise<Menu[]> {
  return await db.menu
    .where('kategori')
    .equals(kategori)
    .toArray();
}

// Get menu by ID
export async function getMenuById(menuId: number): Promise<Menu | undefined> {
  return await db.menu.get(menuId);
}

// Update menu
export async function updateMenu(menuId: number, updates: Partial<Menu>): Promise<void> {
  const now = new Date();
  await db.menu.update(menuId, {
    ...updates,
    updatedAt: now,
    syncStatus: 'pending'
  });

  const updatedItem = await db.menu.get(menuId);
  if (updatedItem) {
    await syncManager.addToQueue('UPDATE', 'menu', menuId, updatedItem);
  }
}

// Toggle menu availability
export async function toggleMenuAvailability(menuId: number): Promise<void> {
  const menu = await db.menu.get(menuId);
  if (!menu) {
    throw new Error('Menu item not found');
  }

  await updateMenu(menuId, { tersedia: !menu.tersedia });
}

// Delete menu
export async function deleteMenu(menuId: number): Promise<void> {
  await db.menu.delete(menuId);
  await syncManager.addToQueue('DELETE', 'menu', menuId, { id: menuId });
}

// Search menu by name
export async function searchMenu(query: string): Promise<Menu[]> {
  const allMenu = await db.menu.toArray();
  const lowerQuery = query.toLowerCase();
  return allMenu.filter(item =>
    item.nama.toLowerCase().includes(lowerQuery)
  );
}
