import { useState } from 'react';
import { Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { clearAllLocalData, clearSpecificLocalData } from '@/lib/clearLocalData';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export function ResetData() {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState<'orders' | 'all' | null>(null);
  const { user } = useAuth();

  const resetOrders = async () => {
    if (!confirming) {
      setConfirming('orders');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('warungAuthToken');
      const response = await axios.delete(`${API_URL}/api/reset/orders`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast.success(`Berhasil menghapus ${response.data.data.deletedOrdersCount} pesanan dan data terkait`);

        // Clear all local data using utility function
        const success = await clearAllLocalData();
        if (!success) {
          toast.error('Gagal membersihkan data lokal');
        }
      }
    } catch (error) {
      console.error('Reset orders error:', error);
      toast.error('Gagal menghapus data pesanan');
    } finally {
      setLoading(false);
      setConfirming(null);
    }
  };

  const resetAll = async () => {
    if (!confirming) {
      setConfirming('all');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('warungAuthToken');
      const response = await axios.delete(`${API_URL}/api/reset/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast.success(`Berhasil menghapus semua data:
        - ${response.data.data.deletedOrdersCount} pesanan
        - ${response.data.data.deletedMenuCount} menu
        - ${response.data.data.deletedInventoryCount} inventory`);

        // Clear all local data using utility function
        const success = await clearAllLocalData();
        if (!success) {
          toast.error('Gagal membersihkan data lokal');
        }
      }
    } catch (error) {
      console.error('Reset all data error:', error);
      toast.error('Gagal menghapus semua data');
    } finally {
      setLoading(false);
      setConfirming(null);
    }
  };

  const clearLocalOnly = async () => {
    setLoading(true);
    try {
      const success = await clearAllLocalData();
      if (success) {
        toast.success('✅ Semua data lokal berhasil dibersihkan!');
      } else {
        toast.error('❌ Gagal membersihkan data lokal');
      }
    } catch (error) {
      console.error('Clear local data error:', error);
      toast.error('Gagal membersihkan data lokal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reset Data</h1>
          <p className="text-gray-600 mt-1">Hapus data dari database dan local storage</p>
        </div>
      </div>

      {/* Warning Alert */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center text-red-800">
            <AlertTriangle className="h-5 w-5 mr-2" />
            PERINGATAN: TINDAKAN BERBAHAYA
          </CardTitle>
        </CardHeader>
        <CardContent className="text-red-700">
          <p className="mb-2">
            <strong>Ini akan menghapus data PERMANEN dari database server dan local storage!</strong>
          </p>
          <p>
            Data yang dihapus tidak dapat dikembalikan lagi. Pastikan Anda benar-benar yakin sebelum melanjutkan.
          </p>
        </CardContent>
      </Card>

      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Akun Saat Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Warung:</strong> {user?.warungNama}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>User ID:</strong> {user?.id}</p>
          </div>
        </CardContent>
      </Card>

      {/* Clear Local Data Only */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <RefreshCw className="h-5 w-5 mr-2" />
            Clear Local Data Only
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>Menghapus:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>IndexedDB (pesanan, menu, inventory)</li>
                <li>LocalStorage (warung-pos-*)</li>
                <li>SessionStorage</li>
                <li>Browser Cache</li>
                <li>Service Worker</li>
              </ul>
              <p className="mt-2 font-medium text-blue-600">
                <strong>Dipertahankan:</strong>
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1 text-blue-600">
                <li>Database server (tidak dihapus)</li>
                <li>Gambar menu (Base64 & Server)</li>
              </ul>
              <p className="mt-2 text-xs text-blue-700 bg-blue-50 p-2 rounded">
                <strong>Catatan:</strong> Ini akan membersihkan cache lokal dan memaksa reload dari server.
                Gambar menu akan dipertahankan baik yang tersimpan lokal (Base64) maupun di server.
              </p>
            </div>

            <Button
              onClick={clearLocalOnly}
              disabled={loading}
              variant="outline"
              className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Membersihkan...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Local Data Only
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reset Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reset Orders Only */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <Trash2 className="h-5 w-5 mr-2" />
              Reset Pesanan Saja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>Menghapus:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Semua data pesanan</li>
                  <li>Laporan harian</li>
                  <li>Sync logs terkait pesanan</li>
                </ul>
                <p className="mt-2 font-medium text-orange-600">
                  <strong>Dipertahankan:</strong> Menu, Inventory, Data User
                </p>
              </div>

              <Button
                onClick={resetOrders}
                disabled={loading}
                variant={confirming === 'orders' ? 'destructive' : 'outline'}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Menghapus...
                  </>
                ) : confirming === 'orders' ? (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    KONFIRMASI: Hapus Semua Pesanan
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus Pesanan Saja
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reset All Data */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Reset SEMUA Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>Menghapus:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Semua data pesanan</li>
                  <li>Semua data menu</li>
                  <li>Semua data inventory</li>
                  <li>Laporan harian</li>
                  <li>Semua sync logs</li>
                </ul>
                <p className="mt-2 font-medium text-red-600">
                  <strong>Dipertahankan:</strong> Akun user & device
                </p>
              </div>

              <Button
                onClick={resetAll}
                disabled={loading}
                variant={confirming === 'all' ? 'destructive' : 'destructive'}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Menghapus...
                  </>
                ) : confirming === 'all' ? (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    KONFIRMASI: HAPUS SEMUA DATA!
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus Semua Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Petunjuk Penggunaan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              <strong>Jika database sudah direset server:</strong> Gunakan tombol "Clear Local Data Only" (biru) untuk membersihkan cache lokal.
            </li>
            <li>
              <strong>Reset penuh:</strong> Gunakan "Hapus Pesanan Saja" atau "Hapus Semua Data" untuk reset di server + lokal.
            </li>
            <li>
              <strong>Klik tombol sekali:</strong> Untuk konfirmasi pertama (tombol akan berubah warna).
            </li>
            <li>
              <strong>Klik lagi untuk konfirmasi final:</strong> Data akan dihapus permanen.
            </li>
            <li>
              <strong>Halaman akan reload otomatis:</strong> Setelah penghapusan selesai.
            </li>
          </ol>
          <div className="space-y-2">
            <div className="bg-blue-50 p-3 rounded-md text-blue-800 text-sm">
              <strong>💡 Tip:</strong> Setelah reset database server, gunakan "Clear Local Data Only" untuk sinkronisasi ulang.
            </div>
            <div className="bg-green-50 p-3 rounded-md text-green-800 text-sm">
              <strong>✨ Rekomendasi:</strong> Clear local data dulu, lalu refresh browser untuk memastikan data kosong.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}