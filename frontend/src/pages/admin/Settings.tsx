import { useEffect, useState } from 'react';
import { Save, Trash2, RefreshCw, Database, Shield, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { db, AppSettings, getDeviceId } from '@/db/schema';
import { syncManager } from '@/lib/sync';

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    description: '',
    type: 'info' as 'info' | 'error' | 'success'
  });

  useEffect(() => {
    loadSettings();
    loadDbStats();
  }, []);

  const showAlert = (title: string, description: string, type: 'info' | 'error' | 'success' = 'info') => {
    setAlertConfig({ title, description, type });
    setAlertOpen(true);
  };

  const loadSettings = async () => {
    try {
      const deviceId = getDeviceId();
      const appSettings = await db.settings.where('deviceId').equals(deviceId).first();

      if (appSettings) {
        setSettings(appSettings);
        setFormData({
          deviceName: appSettings.deviceName,
          warungNama: appSettings.warungNama,
          warungAlamat: appSettings.warungAlamat || '',
          autoSyncEnabled: appSettings.autoSyncEnabled
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDbStats = async () => {
    const menuCount = await db.menu.count();
    const inventoryCount = await db.inventory.count();
    const ordersCount = await db.pesanan.count();
    const pendingSyncCount = await db.syncQueue.where('synced').equals(false).count();

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
        warungNama: formData.warungNama,
        warungAlamat: formData.warungAlamat,
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
      showAlert('Success!', 'Settings saved successfully', 'success');
    } catch (error) {
      showAlert('Error', 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncManager.syncNow();
      await loadDbStats();
      showAlert('Success!', 'Data synced successfully', 'success');
    } catch (error) {
      showAlert('Error', 'Failed to sync data', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleClearData = () => {
    setConfirmOpen(true);
  };

  const confirmClearData = async () => {
    try {
      // Clear all data
      await db.pesanan.clear();
      await db.menu.clear();
      await db.inventory.clear();
      await db.dailyReport.clear();
      await db.syncQueue.clear();

      setConfirmOpen(false);
      await loadDbStats();
      showAlert('Success!', 'All data cleared successfully', 'success');
    } catch (error) {
      setConfirmOpen(false);
      showAlert('Error', 'Failed to clear data', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage system settings and preferences</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading settings...</p>
        </div>
      ) : (
        <>
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Device Name</label>
                <Input
                  value={formData.deviceName}
                  onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                  placeholder="My Device"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Device ID: {settings?.deviceId.slice(0, 16)}...
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Warung Name</label>
                <Input
                  value={formData.warungNama}
                  onChange={(e) => setFormData({ ...formData, warungNama: e.target.value })}
                  placeholder="Warung Saya"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Warung Address</label>
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
                  Enable automatic sync
                </label>
              </div>

              <div className="pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Database Statistics */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Database Statistics
              </CardTitle>
              <Button variant="outline" size="sm" onClick={loadDbStats}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{dbStats.menuCount}</p>
                  <p className="text-sm text-gray-600 mt-1">Menu Items</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{dbStats.inventoryCount}</p>
                  <p className="text-sm text-gray-600 mt-1">Inventory Items</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{dbStats.ordersCount}</p>
                  <p className="text-sm text-gray-600 mt-1">Orders</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{dbStats.pendingSyncCount}</p>
                  <p className="text-sm text-gray-600 mt-1">Pending Sync</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sync Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <RefreshCw className="mr-2 h-5 w-5" />
                Data Synchronization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Last sync: {settings?.lastSyncAt ? new Date(settings.lastSyncAt).toLocaleString() : 'Never'}
              </p>

              <div className="flex space-x-2">
                <Button onClick={handleSync} disabled={syncing}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </Button>

                {dbStats.pendingSyncCount > 0 && (
                  <div className="flex items-center text-yellow-600 text-sm">
                    <Bell className="mr-1 h-4 w-4" />
                    {dbStats.pendingSyncCount} items waiting to sync
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Warning: This action will permanently delete all local data including menu items,
                  inventory, orders, and reports. This cannot be undone.
                </p>
                <Button variant="destructive" onClick={handleClearData}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Data
                </Button>
              </div>
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

      {/* Confirm Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Data?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all data? This action cannot be undone and will
              remove all menu items, inventory, orders, and reports from this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmClearData}>
              Delete All Data
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
