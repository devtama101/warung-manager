import { useEffect, useState } from 'react';
import { Smartphone, Monitor, Tablet, CheckCircle, XCircle, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { getDeviceId } from '@/db/schema';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Device {
  id: number;
  deviceId: string;
  deviceName: string;
  lastSeenAt: string | null;
  createdAt: string;
  isCurrentDevice: boolean;
}

export function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDevice, setEditingDevice] = useState<number | null>(null);
  const [newDeviceName, setNewDeviceName] = useState('');
  const currentDeviceId = getDeviceId();

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/devices`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('warungAuthToken')}`
        }
      });

      if (response.data.success) {
        const devicesData = response.data.data.map((device: any) => ({
          ...device,
          isCurrentDevice: device.deviceId === currentDeviceId
        }));
        setDevices(devicesData);
      }
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRenameDevice = async (deviceId: number) => {
    if (!newDeviceName.trim()) return;

    try {
      const response = await axios.put(
        `${API_URL}/api/devices/${deviceId}`,
        { deviceName: newDeviceName },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('warungAuthToken')}`
          }
        }
      );

      if (response.data.success) {
        await loadDevices();
        setEditingDevice(null);
        setNewDeviceName('');
      }
    } catch (error) {
      console.error('Failed to rename device:', error);
      alert('Gagal mengubah nama perangkat');
    }
  };

  const handleRemoveDevice = async (deviceId: number, isCurrentDevice: boolean) => {
    if (isCurrentDevice) {
      alert('Anda tidak dapat menghapus perangkat yang sedang digunakan');
      return;
    }

    if (!confirm('Apakah Anda yakin ingin menghapus perangkat ini?')) {
      return;
    }

    try {
      const response = await axios.delete(`${API_URL}/api/devices/${deviceId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('warungAuthToken')}`
        }
      });

      if (response.data.success) {
        await loadDevices();
      }
    } catch (error) {
      console.error('Failed to remove device:', error);
      alert('Gagal menghapus perangkat');
    }
  };

  const getDeviceIcon = (deviceName: string) => {
    const name = deviceName.toLowerCase();
    if (name.includes('phone') || name.includes('mobile')) {
      return <Smartphone className="h-8 w-8 text-blue-600" />;
    } else if (name.includes('tablet') || name.includes('ipad')) {
      return <Tablet className="h-8 w-8 text-purple-600" />;
    } else {
      return <Monitor className="h-8 w-8 text-green-600" />;
    }
  };

  const isOnline = (lastSeenAt: string | null) => {
    if (!lastSeenAt) return false;
    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / 1000 / 60;
    return diffMinutes < 5; // Consider online if seen in last 5 minutes
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Perangkat</h1>
          <p className="text-gray-600 mt-1">Pantau dan kelola semua perangkat yang terhubung ke warung Anda</p>
        </div>
      </div>

      {/* Current Device Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Smartphone className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">Perangkat Saat Ini</p>
              <p className="text-xs text-blue-700">ID: {currentDeviceId.slice(0, 16)}...</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Devices List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Memuat perangkat...</p>
        </div>
      ) : devices.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Belum ada perangkat terdaftar</p>
            <p className="text-sm text-gray-500 mt-2">
              Perangkat akan muncul di sini secara otomatis ketika Anda login dari perangkat berbeda
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {devices.map((device) => (
            <Card key={device.id} className={device.isCurrentDevice ? 'border-blue-500 border-2' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="mt-1">
                      {getDeviceIcon(device.deviceName)}
                    </div>

                    <div className="flex-1">
                      {editingDevice === device.id ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={newDeviceName}
                            onChange={(e) => setNewDeviceName(e.target.value)}
                            placeholder="Masukkan nama perangkat"
                            className="max-w-xs"
                            autoFocus
                          />
                          <Button
                            onClick={() => handleRenameDevice(device.id)}
                            size="sm"
                          >
                            Simpan
                          </Button>
                          <Button
                            onClick={() => {
                              setEditingDevice(null);
                              setNewDeviceName('');
                            }}
                            variant="outline"
                            size="sm"
                          >
                            Batal
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold">{device.deviceName}</h3>
                          {device.isCurrentDevice && (
                            <Badge variant="default" className="bg-blue-600">
                              Perangkat Saat Ini
                            </Badge>
                          )}
                          {isOnline(device.lastSeenAt) ? (
                            <Badge variant="default" className="bg-green-600 flex items-center gap-1">
                              <CheckCircle size={12} />
                              Online
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <XCircle size={12} />
                              Offline
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                        <div>
                          <p className="text-gray-600">ID Perangkat</p>
                          <p className="font-medium font-mono text-xs">
                            {device.deviceId.slice(0, 8)}...{device.deviceId.slice(-8)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Terakhir Aktif</p>
                          <p className="font-medium">
                            {device.lastSeenAt
                              ? formatDateTime(new Date(device.lastSeenAt))
                              : 'Belum Pernah'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Terdaftar</p>
                          <p className="font-medium">
                            {new Date(device.createdAt).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {editingDevice !== device.id && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingDevice(device.id);
                          setNewDeviceName(device.deviceName);
                        }}
                      >
                        <Edit2 size={16} className="mr-2" />
                        Ubah Nama
                      </Button>
                      {!device.isCurrentDevice && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveDevice(device.id, device.isCurrentDevice)}
                        >
                          <Trash2 size={16} className="mr-2" />
                          Hapus
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Total Perangkat: <span className="font-semibold">{devices.length}</span>
            </span>
            <span className="text-gray-600">
              Online: <span className="font-semibold text-green-600">
                {devices.filter(d => isOnline(d.lastSeenAt)).length}
              </span> |
              Offline: <span className="font-semibold text-gray-600 ml-2">
                {devices.filter(d => !isOnline(d.lastSeenAt)).length}
              </span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <h3 className="font-medium text-yellow-900 mb-2">Tips Manajemen Perangkat</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Perangkat otomatis terdaftar saat Anda login dari perangkat baru</li>
            <li>• Anda dapat mengubah nama perangkat untuk memudahkan identifikasi (misal: "Kasir 1", "Tablet Dapur")</li>
            <li>• Perangkat dianggap online jika aktif dalam 5 menit terakhir</li>
            <li>• Anda tidak dapat menghapus perangkat yang sedang digunakan</li>
            <li>• Semua perangkat berbagi data yang sama melalui sinkronisasi cloud</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
