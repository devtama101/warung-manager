import { useEffect, useState } from 'react';
import { db } from '../db/schema';
import { syncManager } from '../lib/sync';

interface SyncQueueItem {
  id?: number;
  action: string;
  table: string;
  recordId: number;
  data: any;
  timestamp: number;
  synced: boolean;
  retryCount: number;
  error?: string;
}

export default function DebugSync() {
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>([]);
  const [pesananCount, setPesananCount] = useState(0);
  const [menuCount, setMenuCount] = useState(0);
  const [inventoryCount, setInventoryCount] = useState(0);

  const loadData = async () => {
    const queue = await db.syncQueue.toArray();
    setQueueItems(queue as SyncQueueItem[]);

    const pesanan = await db.pesanan.count();
    setPesananCount(pesanan);

    const menu = await db.menu.count();
    setMenuCount(menu);

    const inventory = await db.inventory.count();
    setInventoryCount(inventory);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    await loadData();
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Sinkronisasi Data</h1>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-100 p-4 rounded">
          <h3 className="font-bold">Pesanan (Local)</h3>
          <p className="text-2xl">{pesananCount}</p>
        </div>
        <div className="bg-green-100 p-4 rounded">
          <h3 className="font-bold">Menu (Local)</h3>
          <p className="text-2xl">{menuCount}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded">
          <h3 className="font-bold">Inventory (Local)</h3>
          <p className="text-2xl">{inventoryCount}</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={handleRefresh}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Refresh
        </button>
        <div className="flex-1"></div>
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Auto-sync aktif (setiap 5 menit)
        </div>
      </div>

      <h2 className="text-xl font-bold mb-2">Antrian Sinkronisasi ({queueItems.length} item)</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">Action</th>
              <th className="border px-4 py-2">Table</th>
              <th className="border px-4 py-2">Record ID</th>
              <th className="border px-4 py-2">Synced</th>
              <th className="border px-4 py-2">Retry Count</th>
              <th className="border px-4 py-2">Error</th>
              <th className="border px-4 py-2">Data</th>
            </tr>
          </thead>
          <tbody>
            {queueItems.map((item) => (
              <tr key={item.id} className={item.synced ? 'bg-green-50' : item.error ? 'bg-red-50' : ''}>
                <td className="border px-4 py-2">{item.id}</td>
                <td className="border px-4 py-2">{item.action}</td>
                <td className="border px-4 py-2">{item.table}</td>
                <td className="border px-4 py-2">{item.recordId}</td>
                <td className="border px-4 py-2">{item.synced ? '✅' : '❌'}</td>
                <td className="border px-4 py-2">{item.retryCount}</td>
                <td className="border px-4 py-2 text-red-600 text-xs">{item.error || '-'}</td>
                <td className="border px-4 py-2">
                  <details>
                    <summary className="cursor-pointer text-blue-600">View</summary>
                    <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-auto max-w-md">
                      {JSON.stringify(item.data, null, 2)}
                    </pre>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {queueItems.length === 0 && (
        <p className="text-gray-500 text-center py-8">Sync queue kosong</p>
      )}
    </div>
  );
}
