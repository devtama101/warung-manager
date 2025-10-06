import axios from 'axios';
import { db, getDeviceId, SyncQueue } from '../db/schema';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface SyncQueueItem extends SyncQueue {
  id: number;
}

class SyncManager {
  private isSyncing = false;
  private maxRetries = 3;
  private syncInterval: number | null = null;

  // Add item to sync queue
  async addToQueue(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    table: 'orders' | 'menuItems' | 'inventoryItems' | 'dailyReports',
    recordId: number,
    data: any
  ): Promise<void> {
    // Ensure recordId is a valid number
    const validRecordId = typeof recordId === 'number' && !isNaN(recordId) ? recordId : Math.floor(Math.random() * 1000000);

    await db.syncQueue.add({
      action,
      table,
      recordId: validRecordId,
      data,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0
    });
  }

  // Process sync queue
  async processQueue(): Promise<void> {
    if (this.isSyncing) return;
    if (!navigator.onLine) {
      throw new Error('Tidak ada koneksi internet');
    }

    this.isSyncing = true;

    try {
      // Get all unsynced items and filter manually
      const allQueue = await db.syncQueue.toArray();
      const queue = allQueue.filter(item =>
        !item.synced && item.retryCount < this.maxRetries
      );

      if (queue.length === 0) {
        console.log('No items to sync');
        return;
      }

      console.log(`Processing ${queue.length} sync items`);

      let successCount = 0;
      let errorCount = 0;

      for (const item of queue) {
        try {
          await this.syncItem(item as SyncQueueItem);
          await db.syncQueue.update(item.id!, { synced: true });
          successCount++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Sync failed for item ${item.id}:`, errorMessage);

          await db.syncQueue.update(item.id!, {
            retryCount: item.retryCount + 1,
            error: errorMessage
          });
          errorCount++;
        }
      }

      // Update last sync time
      const settings = await db.settings.toArray();
      if (settings.length > 0) {
        await db.settings.update(settings[0].id!, {
          lastSyncAt: new Date(),
          updatedAt: new Date()
        });
      }

      if (errorCount > 0) {
        throw new Error(`${errorCount} dari ${queue.length} item gagal disinkronkan`);
      }

    } finally {
      this.isSyncing = false;
    }
  }

  // Sync individual item
  private async syncItem(item: SyncQueueItem): Promise<void> {
    const endpoint = `${API_BASE_URL}/api/sync/${item.table}`;
    // Try both admin and warung auth tokens (admin for owner, warung for employees)
    const token = localStorage.getItem('adminAuthToken') || localStorage.getItem('warungAuthToken');

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.post(endpoint, {
      action: item.action,
      recordId: item.recordId,
      data: item.data,
      timestamp: item.timestamp,
      deviceId: getDeviceId()
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Sync failed');
    }

    // Handle conflict resolution
    if (response.data.conflict) {
      console.warn('Sync conflict detected:', response.data);
      // Conflict data includes serverData that should be used to update local record
      return response.data;
    }
  }

  // Start auto-sync (listen to online event)
  startAutoSync(): void {
    // Listen to online event
    window.addEventListener('online', () => {
      this.processQueue();
    });

    // Also sync every 5 minutes if online
    this.syncInterval = window.setInterval(() => {
      if (navigator.onLine) {
        this.processQueue();
      }
    }, 5 * 60 * 1000);
  }

  // Stop auto-sync
  stopAutoSync(): void {
    if (this.syncInterval !== null) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    lastSyncAt?: Date;
    pendingSyncs: number;
    failedSyncs: number;
  }> {
    const settings = await db.settings.toArray();
    const lastSyncAt = settings[0]?.lastSyncAt;

    // Get all items and filter manually to avoid key range issues
    const allItems = await db.syncQueue.toArray();
    const pendingSyncs = allItems.filter(item => !item.synced).length;
    const failedSyncs = allItems.filter(item => !item.synced && item.retryCount >= this.maxRetries).length;

    return {
      lastSyncAt,
      pendingSyncs,
      failedSyncs
    };
  }

  // Manual sync trigger
  async manualSync(): Promise<void> {
    await this.processQueue();
  }

  // Sync now - alias for manualSync for better naming
  async syncNow(): Promise<void> {
    // Check server connection first
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
      if (response.status !== 200) {
        throw new Error('Server tidak dapat dijangkau');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error('Server tidak dapat dijangkau. Periksa koneksi internet dan server status.');
      }
      throw error;
    }

    await this.processQueue();
  }
}

export const syncManager = new SyncManager();
