import { db } from '@/db/schema';

export interface DatabaseStats {
  pesanan: number;
  menu: number;
  inventory: number;
  dailyReport: number;
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
  private isMonitoring = false;
  private monitoringInterval: number | null = null;

  static getInstance(): IndexedDBDebugger {
    if (!IndexedDBDebugger.instance) {
      IndexedDBDebugger.instance = new IndexedDBDebugger();
    }
    return IndexedDBDebugger.instance;
  }

  // Get current database statistics
  async getDatabaseStats(): Promise<DatabaseInfo> {
    try {
      const [
        pesananCount,
        menuCount,
        inventoryCount,
        dailyReportCount,
        syncQueueCount,
        settingsCount
      ] = await Promise.all([
        db.pesanan.count(),
        db.menu.count(),
        db.inventory.count(),
        db.dailyReport.count(),
        db.syncQueue.count(),
        db.settings.count()
      ]);

      // Get pending sync count
      const pendingSync = await db.syncQueue.where('synced').equals(false).count();

      // Get last sync timestamp
      const lastSetting = await db.settings.orderBy('updatedAt').last();
      const lastSyncAt = lastSetting?.lastSyncAt;

      const stats: DatabaseStats = {
        pesanan: pesananCount,
        menu: menuCount,
        inventory: inventoryCount,
        dailyReport: dailyReportCount,
        syncQueue: syncQueueCount,
        settings: settingsCount
      };

      return {
        stats,
        pendingSync,
        lastSyncAt: lastSyncAt?.toISOString() || undefined
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw error;
    }
  }

  // Get detailed data from specific table
  async getTableData(tableName: keyof typeof db, limit = 10) {
    try {
      const table = db[tableName];
      const data = await table.limit(limit).toArray();
      return data;
    } catch (error) {
      console.error(`Error getting data from ${tableName}:`, error);
      throw error;
    }
  }

  // Get pending sync items
  async getPendingSyncItems() {
    try {
      const pendingItems = await db.syncQueue.where('synced').equals(false).toArray();
      return pendingItems;
    } catch (error) {
      console.error('Error getting pending sync items:', error);
      throw error;
    }
  }

  // Search data in tables
  async searchData(searchTerm: string, tableName?: keyof typeof db) {
    const results: any = {};

    const tablesToSearch = tableName ? [tableName] : ['pesanan', 'menu', 'inventory'];

    for (const table of tablesToSearch) {
      try {
        const allData = await db[table].toArray();
        const filteredData = allData.filter(item => {
          return JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase());
        });
        results[table] = filteredData;
      } catch (error) {
        console.error(`Error searching in ${table}:`, error);
      }
    }

    return results;
  }

  // Export all data to JSON
  async exportAllData() {
    try {
      const [pesanan, menu, inventory, dailyReport, syncQueue, settings] = await Promise.all([
        db.pesanan.toArray(),
        db.menu.toArray(),
        db.inventory.toArray(),
        db.dailyReport.toArray(),
        db.syncQueue.toArray(),
        db.settings.toArray()
      ]);

      const exportData = {
        timestamp: new Date().toISOString(),
        data: {
          pesanan,
          menu,
          inventory,
          dailyReport,
          syncQueue,
          settings
        }
      };

      return exportData;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // Clear specific table
  async clearTable(tableName: keyof typeof db) {
    try {
      await db[tableName].clear();
      console.log(`✅ Table ${tableName} cleared successfully`);
    } catch (error) {
      console.error(`Error clearing ${tableName}:`, error);
      throw error;
    }
  }

  // Start real-time monitoring
  startMonitoring(intervalMs = 5000) {
    if (this.isMonitoring) {
      console.log('⚠️ Monitoring already started');
      return;
    }

    this.isMonitoring = true;
    console.log('🔍 Started IndexedDB monitoring...');

    this.monitoringInterval = window.setInterval(async () => {
      try {
        const stats = await this.getDatabaseStats();
        console.group('📊 IndexedDB Status');
        console.log('📝 Pesanan:', stats.stats.pesanan);
        console.log('🍽️ Menu:', stats.stats.menu);
        console.log('📦 Inventory:', stats.stats.inventory);
        console.log('📈 Daily Reports:', stats.stats.dailyReport);
        console.log('⏳ Sync Queue:', stats.stats.syncQueue);
        console.log('🔄 Pending Sync:', stats.pendingSync);
        console.log('⚙️ Settings:', stats.stats.settings);
        if (stats.lastSyncAt) {
          console.log('🕐 Last Sync:', new Date(stats.lastSyncAt).toLocaleString());
        }
        console.groupEnd();
      } catch (error) {
        console.error('❌ Monitoring error:', error);
      }
    }, intervalMs);
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.isMonitoring = false;
      console.log('⏹️ Stopped IndexedDB monitoring');
    }
  }

  // Log database info
  async logDatabaseInfo() {
    try {
      const info = await this.getDatabaseStats();
      console.group('🗄️ IndexedDB Information');
      console.table(info.stats);
      console.log('🔄 Pending Sync Items:', info.pendingSync);
      if (info.lastSyncAt) {
        console.log('🕐 Last Sync At:', new Date(info.lastSyncAt).toLocaleString());
      }
      console.groupEnd();
      return info;
    } catch (error) {
      console.error('❌ Error getting database info:', error);
    }
  }

  // Analyze database health
  async analyzeHealth() {
    const info = await this.getDatabaseStats();
    const issues: string[] = [];

    // Check for pending sync items
    if (info.pendingSync > 0) {
      issues.push(`${info.pendingSync} items waiting to sync`);
    }

    // Check for empty database
    const totalRecords = Object.values(info.stats).reduce((sum, count) => sum + count, 0);
    if (totalRecords === 0) {
      issues.push('Database appears to be empty');
    }

    // Check for very large sync queue
    if (info.stats.syncQueue > 100) {
      issues.push(`Large sync queue (${info.stats.syncQueue} items)`);
    }

    return {
      healthy: issues.length === 0,
      issues,
      stats: info.stats
    };
  }
}

// Export utility functions for easy access
export const debugDB = IndexedDBDebugger.getInstance();

// Global functions for console access
(window as any).debugDB = {
  stats: () => debugDB.getDatabaseStats(),
  logInfo: () => debugDB.logDatabaseInfo(),
  monitor: (interval?: number) => debugDB.startMonitoring(interval),
  stopMonitor: () => debugDB.stopMonitoring(),
  export: () => debugDB.exportAllData(),
  search: (term: string, table?: keyof typeof db) => debugDB.searchData(term, table),
  getTable: (table: keyof typeof db, limit?: number) => debugDB.getTableData(table, limit),
  clearTable: (table: keyof typeof db) => debugDB.clearTable(table),
  pending: () => debugDB.getPendingSyncItems(),
  health: () => debugDB.analyzeHealth()
};

// Add to window for easy console debugging
console.log(`
🔍 IndexedDB Debugger Available!
Commands:
- debugDB.stats()     - Get database statistics
- debugDB.logInfo()   - Log detailed database info
- debugDB.monitor()   - Start real-time monitoring
- debugDB.stopMonitor() - Stop monitoring
- debugDB.export()    - Export all data
- debugDB.search('term') - Search data
- debugDB.getTable('pesanan') - Get table data
- debugDB.pending()   - Get pending sync items
- debugDB.health()    - Analyze database health
`);