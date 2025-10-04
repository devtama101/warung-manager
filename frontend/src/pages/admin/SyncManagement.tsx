import { useEffect, useState } from 'react';
import axios from 'axios';
import { RefreshCw, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface SyncLog {
  id: number;
  userId: number;
  deviceId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  table: string;
  recordId: number | null;
  data: any;
  timestamp: string;
  success: boolean;
  error: string | null;
}

interface SyncedData {
  pesanan: any[];
  menu: any[];
  inventory: any[];
}

export default function SyncManagement() {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [syncedData, setSyncedData] = useState<SyncedData>({ pesanan: [], menu: [], inventory: [] });
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<'all' | 'pesanan' | 'menu' | 'inventory'>('all');

  useEffect(() => {
    document.title = 'Kelola Sinkronisasi - Warung POS';
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminAuthToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Load sync logs
      const logsResponse = await axios.get(`${API_URL}/api/admin/sync-logs`, { headers });
      setSyncLogs(logsResponse.data.logs || []);

      // Load synced data
      const dataResponse = await axios.get(`${API_URL}/api/admin/synced-data`, { headers });
      setSyncedData(dataResponse.data || { pesanan: [], menu: [], inventory: [] });
    } catch (error) {
      console.error('Failed to load sync data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (table: string, recordId: number) => {
    if (!confirm(`Hapus data ini dari ${table}?`)) return;

    try {
      const token = localStorage.getItem('adminAuthToken');
      await axios.delete(`${API_URL}/api/admin/synced-data/${table}/${recordId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Data berhasil dihapus');
      loadData();
    } catch (error) {
      alert('Gagal menghapus data');
      console.error(error);
    }
  };

  const filteredLogs = selectedTable === 'all'
    ? syncLogs
    : syncLogs.filter(log => log.table === selectedTable);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Kelola Sinkronisasi</h1>
        <button
          onClick={loadData}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncLogs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pesanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{syncedData.pesanan.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Menu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{syncedData.menu.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{syncedData.inventory.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSelectedTable('all')}
          className={`px-4 py-2 rounded ${selectedTable === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Semua
        </button>
        <button
          onClick={() => setSelectedTable('pesanan')}
          className={`px-4 py-2 rounded ${selectedTable === 'pesanan' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Pesanan
        </button>
        <button
          onClick={() => setSelectedTable('menu')}
          className={`px-4 py-2 rounded ${selectedTable === 'menu' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Menu
        </button>
        <button
          onClick={() => setSelectedTable('inventory')}
          className={`px-4 py-2 rounded ${selectedTable === 'inventory' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Inventory
        </button>
      </div>

      {/* Sync Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Sinkronisasi ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Belum ada data sinkronisasi</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Waktu</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Device</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Aksi</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tabel</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Record ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Data</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className={log.success ? '' : 'bg-red-50'}>
                      <td className="px-4 py-2">
                        {log.success ? (
                          <CheckCircle className="text-green-500" size={16} />
                        ) : (
                          <AlertCircle className="text-red-500" size={16} />
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {new Date(log.timestamp).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-2 text-sm">{log.deviceId}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                          log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm font-medium">{log.table}</td>
                      <td className="px-4 py-2 text-sm">{log.recordId || '-'}</td>
                      <td className="px-4 py-2 text-sm">
                        <details className="cursor-pointer">
                          <summary className="text-blue-600">Lihat</summary>
                          <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-auto max-w-md">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      </td>
                      <td className="px-4 py-2">
                        {log.success && log.recordId && (
                          <button
                            onClick={() => handleDeleteRecord(log.table, log.recordId!)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
