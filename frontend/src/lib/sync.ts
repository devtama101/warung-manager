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
    table: 'pesanan' | 'menu' | 'inventory' | 'dailyReport',
    recordId: number,
    data: any
  ): Promise<void> {
    await db.syncQueue.add({
      action,
      table,
      recordId,
      data,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0
    });
  }

  // Process sync queue
  async processQueue(): Promise<void> {
    if (this.isSyncing) return;
    if (!navigator.onLine) return;

    this.isSyncing = true;

    try {
      const queue = await db.syncQueue
        .where('synced')
        .equals(false)
        .and(item => item.retryCount < this.maxRetries)
        .toArray();

      for (const item of queue) {
        try {
          await this.syncItem(item as SyncQueueItem);
          await db.syncQueue.update(item.id!, { synced: true });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await db.syncQueue.update(item.id!, {
            retryCount: item.retryCount + 1,
            error: errorMessage
          });
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
    } finally {
      this.isSyncing = false;
    }
  }

  // Sync individual item
  private async syncItem(item: SyncQueueItem): Promise<void> {
    const endpoint = `${API_BASE_URL}/api/sync/${item.table}`;
    const token = localStorage.getItem('authToken');

    await axios.post(endpoint, {
      action: item.action,
      recordId: item.recordId,
      data: item.data,
      timestamp: item.timestamp,
      deviceId: getDeviceId()
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
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

    const pendingSyncs = await db.syncQueue
      .where('synced')
      .equals(false)
      .count();

    const failedSyncs = await db.syncQueue
      .where('synced')
      .equals(false)
      .and(item => item.retryCount >= this.maxRetries)
      .count();

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
}

export const syncManager = new SyncManager();
