import { useEffect, useState } from 'react';
import { Save, RefreshCw, Database, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { db, AppSettings, getDeviceId } from '@/db/schema';
import { syncManager } from '@/lib/sync';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [formData, setFormData] = useState({
    deviceName: '',
    warungNama: '',
    warungAlamat: '',
    autoSyncEnabled: true
  });

  // Database stats
  const [dbStats, setDbStats] = useState({
    menuCount: 0,
    inventoryCount: 0,
    ordersCount: 0,
    pendingSyncCount: 0
  });

  // Alert state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    description: '',
    type: 'info' as 'info' | 'error' | 'success'
  });

  useEffect(() => {
    loadSettings();
    loadDbStats();
    registerDeviceIfNeeded();
  }, []);

  const showAlert = (title: string, description: string, type: 'info' | 'error' | 'success' = 'info') => {
    setAlertConfig({ title, description, type });
    setAlertOpen(true);
  };

  const registerDeviceIfNeeded = async () => {
    try {
      const token = localStorage.getItem('adminAuthToken');
      if (!token) return;

      const deviceId = getDeviceId();
      const deviceName = `Admin-${deviceId.slice(0, 8)}`;

      // Register device using the new endpoint
      await axios.post(`${API_BASE_URL}/api/devices/register`, {
        deviceId,
        deviceName
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Device registered successfully');
    } catch (error) {
      console.error('Device registration failed:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const deviceId = getDeviceId();
      const appSettings = await db.settings.where('deviceId').equals(deviceId).first();

      if (appSettings) {
        setSettings(appSettings);
        setFormData({
          deviceName: appSettings.deviceName,
          warungNama: appSettings.businessName,
          warungAlamat: appSettings.businessAddress || '',
          autoSyncEnabled: appSettings.autoSyncEnabled
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDbStats = async () => {
    const menuCount = await db.menuItems.count();
    const inventoryCount = await db.inventoryItems.count();
    const ordersCount = await db.orders.count();

    // Get pending sync count manually to avoid key range issues
    const allSyncItems = await db.syncQueue.toArray();
    const pendingSyncCount = allSyncItems.filter(item => !item.synced).length;

    setDbStats({
      menuCount,
      inventoryCount,
      ordersCount,
      pendingSyncCount
    });
  };

  const handleSave = async () => {
    if (!settings?.id) return;

    setSaving(true);
    try {
      await db.settings.update(settings.id, {
        deviceName: formData.deviceName,
        businessName: formData.warungNama,
        businessAddress: formData.warungAlamat,
        autoSyncEnabled: formData.autoSyncEnabled,
        updatedAt: new Date()
      });

      // Restart sync manager if auto-sync setting changed
      if (formData.autoSyncEnabled !== settings.autoSyncEnabled) {
        if (formData.autoSyncEnabled) {
          syncManager.startAutoSync();
        } else {
          syncManager.stopAutoSync();
        }
      }

      await loadSettings();
      showAlert('Berhasil!', 'Pengaturan berhasil disimpan', 'success');
    } catch (error) {
      showAlert('Error', 'Gagal menyimpan pengaturan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Add a test item to sync queue if empty
      const allSyncItems = await db.syncQueue.toArray();
      const pendingCount = allSyncItems.filter(item => !item.synced).length;

      if (pendingCount === 0) {
        // Add a test sync item dengan ID yang valid
        const testId = Math.floor(Math.random() * 1000000);
        await syncManager.addToQueue(
          'CREATE',
          'orders',
          testId,
          { test: 'sync data', timestamp: new Date().toISOString() }
        );

        showAlert('Info', 'Menambahkan test data untuk sinkronisasi...', 'info');
      }

      await syncManager.syncNow();
      await loadDbStats();
      showAlert('Berhasil!', 'Data berhasil disinkronkan', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyinkronkan data';
      showAlert('Error', errorMessage, 'error');
    } finally {
      setSyncing(false);
    }
  };

  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-gray-600 mt-1">Kelola pengaturan dan preferensi sistem</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Memuat pengaturan...</p>
        </div>
      ) : (
        <>
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Umum</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama Perangkat</label>
                <Input
                  value={formData.deviceName}
                  onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                  placeholder="Perangkat Saya"
                />
                <p className="text-xs text-gray-600 mt-1">
                  ID Perangkat: {settings?.deviceId.slice(0, 16)}...
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nama Warung</label>
                <Input
                  value={formData.warungNama}
                  onChange={(e) => setFormData({ ...formData, warungNama: e.target.value })}
                  placeholder="Warung Saya"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Alamat Warung</label>
                <Input
                  value={formData.warungAlamat}
                  onChange={(e) => setFormData({ ...formData, warungAlamat: e.target.value })}
                  placeholder="Jl. Contoh No. 123"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="autoSync"
                  checked={formData.autoSyncEnabled}
                  onChange={(e) => setFormData({ ...formData, autoSyncEnabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="autoSync" className="text-sm font-medium">
                  Aktifkan sinkronisasi otomatis
                </label>
              </div>

              <div className="pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Database Statistics */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Statistik Database Lokal
              </CardTitle>
              <Button variant="outline" size="sm" onClick={loadDbStats}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{dbStats.menuCount}</p>
                  <p className="text-sm text-gray-600 mt-1">Item Menu</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{dbStats.inventoryCount}</p>
                  <p className="text-sm text-gray-600 mt-1">Item Inventori</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{dbStats.ordersCount}</p>
                  <p className="text-sm text-gray-600 mt-1">Order</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{dbStats.pendingSyncCount}</p>
                  <p className="text-sm text-gray-600 mt-1">Pending Sync</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Informasi Database</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Records:</span>
                      <span className="font-medium">
                        {dbStats.menuCount + dbStats.inventoryCount + dbStats.ordersCount + dbStats.pendingSyncCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium text-green-600">Online</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Terakhir diupdate:</span>
                      <span className="font-medium">{new Date().toLocaleTimeString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Kinerja Sinkronisasi</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sync Rate:</span>
                      <span className="font-medium">
                        {dbStats.pendingSyncCount === 0 ? '100%' :
                          Math.round(((dbStats.menuCount + dbStats.inventoryCount + dbStats.ordersCount - dbStats.pendingSyncCount) /
                          (dbStats.menuCount + dbStats.inventoryCount + dbStats.ordersCount)) * 100) || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Auto Sync:</span>
                      <span className="font-medium text-green-600">Aktif</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Queue Size:</span>
                      <span className="font-medium">{dbStats.pendingSyncCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sync Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <RefreshCw className="mr-2 h-5 w-5" />
                Sinkronisasi Database
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Sinkronisasi Terakhir</p>
                  <p className="font-medium">
                    {settings?.lastSyncAt ? new Date(settings.lastSyncAt).toLocaleString('id-ID') : 'Belum Pernah'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status Sinkronisasi</p>
                  <p className="font-medium">
                    {dbStats.pendingSyncCount > 0 ? (
                      <span className="text-yellow-600">{dbStats.pendingSyncCount} item menunggu</span>
                    ) : (
                      <span className="text-green-600">Tersinkronisasi</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Auto Sync</p>
                  <p className="font-medium">
                    {formData.autoSyncEnabled ? (
                      <span className="text-green-600">Aktif</span>
                    ) : (
                      <span className="text-gray-600">Nonaktif</span>
                    )}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Device ID</p>
                  <p className="font-medium text-xs">{settings?.deviceId?.slice(0, 8)}...</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleSync} disabled={syncing} className="flex-1">
                  <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData({...formData, autoSyncEnabled: !formData.autoSyncEnabled});
                    if (settings) {
                      handleSave();
                    }
                  }}
                >
                  {formData.autoSyncEnabled ? 'Nonaktifkan Auto' : 'Aktifkan Auto'}
                </Button>
              </div>

              {dbStats.pendingSyncCount > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center text-yellow-700 text-sm">
                    <Bell className="mr-2 h-4 w-4" />
                    {dbStats.pendingSyncCount} item menunggu sinkronisasi. Klik "Sinkronkan Sekarang" untuk memproses.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          </>
      )}

      {/* Alert Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>{alertConfig.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              onClick={() => setAlertOpen(false)}
              variant={alertConfig.type === 'error' ? 'destructive' : 'default'}
            >
              OK
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      </div>
  );
}
