import { db } from '@/db/schema';

export const clearAllLocalData = async () => {
  try {
    console.log('🧹 Starting local data cleanup...');

    // 1. Clear IndexedDB (Dexie) but preserve menu images
    if (db) {
      console.log('📊 Clearing IndexedDB...');

      // Store menu images temporarily
      const menuData = await db.menuItems.toArray();
      const menuImages = new Map<string, string>();

      menuData.forEach(menu => {
        if (menu.image && menu.image.startsWith('data:')) {
          menuImages.set(menu.name, menu.image);
        }
      });

      console.log(`📸 Preserving ${menuImages.size} menu images temporarily...`);

      // Clear database
      await db.delete();
      await db.open();

      // Restore menu with images
      if (menuImages.size > 0) {
        console.log('📸 Restoring menu with preserved images...');
        // Note: This would require the menu structure to be restored from server
        // For now, we'll just log that images were preserved
        localStorage.setItem('preservedMenuImages', JSON.stringify(Object.fromEntries(menuImages)));
      }

      console.log('✅ IndexedDB cleared successfully');
    }

    // 2. Clear localStorage (but preserve menu images)
    console.log('💾 Clearing localStorage...');
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('warung') ||
        key.includes('pos') ||
        key.includes('auth') ||
        key.includes('device') ||
        key.includes('order') ||
        key.includes('menu') ||
        key.includes('inventory')
      )) {
        // Don't remove preserved menu images
        if (key !== 'preservedMenuImages') {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Removed localStorage key: ${key}`);
    });

    // 3. Clear sessionStorage
    console.log('🔄 Clearing sessionStorage...');
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (
        key.includes('warung') ||
        key.includes('pos') ||
        key.includes('auth') ||
        key.includes('device')
      )) {
        sessionStorage.removeItem(key);
        console.log(`🗑️ Removed sessionStorage key: ${key}`);
      }
    }

    // 4. Clear browser caches
    console.log('🌐 Clearing browser caches...');
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(async (cacheName) => {
          await caches.delete(cacheName);
          console.log(`🗑️ Deleted cache: ${cacheName}`);
        })
      );
    }

    // 5. Clear any other potential local storage
    console.log('🧹 Clearing additional storage...');

    // Check for and clear any service worker caches
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('🗑️ Unregistered service worker');
      }
    }

    console.log('✅ All local data cleared successfully!');

    // Force reload after a short delay
    setTimeout(() => {
      console.log('🔄 Reloading page...');
      window.location.reload();
    }, 1000);

    return true;
  } catch (error) {
    console.error('❌ Error clearing local data:', error);
    return false;
  }
};

export const clearSpecificLocalData = async (types: {
  orders?: boolean;
  menu?: boolean;
  inventory?: boolean;
  auth?: boolean;
}) => {
  try {
    console.log('🧹 Starting selective local data cleanup...');

    // Clear specific IndexedDB tables
    if (db) {
      if (types.orders) {
        await db.orders.clear();
        console.log('📊 Cleared orders from IndexedDB');
      }
      if (types.menu) {
        await db.menuItems.clear();
        console.log('📋 Cleared menu from IndexedDB');
      }
      if (types.inventory) {
        await db.inventoryItems.clear();
        console.log('📦 Cleared inventory from IndexedDB');
      }
    }

    // Clear specific localStorage items
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const shouldRemove =
          (types.orders && key.includes('order')) ||
          (types.menu && key.includes('menu')) ||
          (types.inventory && key.includes('inventory')) ||
          (types.auth && (key.includes('auth') || key.includes('token')));

        if (shouldRemove) {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Removed localStorage key: ${key}`);
    });

    console.log('✅ Selective local data cleared successfully!');

    // Force reload after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);

    return true;
  } catch (error) {
    console.error('❌ Error clearing selective local data:', error);
    return false;
  }
};