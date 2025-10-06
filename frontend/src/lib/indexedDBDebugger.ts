import { db } from '@/db/schema';

export interface DatabaseStats {
  orders: number;
  menuItems: number;
  inventoryItems: number;
  dailyReports: number;
  syncQueue: number;
  settings: number;
}

export interface DatabaseInfo {
  stats: DatabaseStats;
  pendingSync: number;
  totalSize?: string;
  lastSyncAt?: string;
}

export class IndexedDBDebugger {
  private static instance: IndexedDBDebugger;

  public static getInstance(): IndexedDBDebugger {
    if (!IndexedDBDebugger.instance) {
      IndexedDBDebugger.instance = new IndexedDBDebugger();
    }
    return IndexedDBDebugger.instance;
  }

  async getDatabaseInfo(): Promise<DatabaseInfo> {
    try {
      // Get table counts
      const [ordersCount, menuItemsCount, inventoryItemsCount, dailyReportsCount, syncQueueCount, settingsCount] = await Promise.all([
        db.orders.count(),
        db.menuItems.count(),
        db.inventoryItems.count(),
        db.dailyReports.count(),
        db.syncQueue.count(),
        db.settings.count()
      ]);

      const stats: DatabaseStats = {
        orders: ordersCount,
        menuItems: menuItemsCount,
        inventoryItems: inventoryItemsCount,
        dailyReports: dailyReportsCount,
        syncQueue: syncQueueCount,
        settings: settingsCount
      };

      // Get pending sync count (simplified)
      const pendingSync = 0; // Simplified for now

      // Get last sync timestamp
      const lastSetting = await db.settings.orderBy('updatedAt').last();
      const lastSyncAt = lastSetting?.lastSyncAt?.toISOString();

      return {
        stats,
        pendingSync,
        lastSyncAt
      };
    } catch (error) {
      console.error('Error getting database info:', error);
      return {
        stats: {
          orders: 0,
          menuItems: 0,
          inventoryItems: 0,
          dailyReports: 0,
          syncQueue: 0,
          settings: 0
        },
        pendingSync: 0
      };
    }
  }

  async exportData() {
    try {
      console.log('Exporting data from IndexedDB...');

      const [orders, menuItems, inventoryItems, dailyReports] = await Promise.all([
        db.orders.toArray(),
        db.menuItems.toArray(),
        db.inventoryItems.toArray(),
        db.dailyReports.toArray()
      ]);

      return {
        orders,
        menuItems,
        inventoryItems,
        dailyReports,
        exportDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async clearAllData() {
    try {
      console.log('Clearing all data from IndexedDB...');

      await Promise.all([
        db.orders.clear(),
        db.menuItems.clear(),
        db.inventoryItems.clear(),
        db.dailyReports.clear(),
        db.syncQueue.clear()
      ]);

      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
}

export const indexedDBDebugger = IndexedDBDebugger.getInstance();