import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, ShoppingCart, Package, DollarSign, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { formatCurrency, formatDateTime } from '@/lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface UserDetailData {
  user: {
    id: number;
    username: string;
    warungNama: string;
    warungAlamat?: string;
    createdAt: string;
  };
  devices: Array<{
    id: number;
    deviceId: string;
    deviceName: string;
    lastSeenAt: string | null;
    createdAt: string;
  }>;
  stats: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    menuItems: number;
    inventoryItems: number;
  };
  recentOrders: Array<{
    id: number;
    tableNumber?: string;
    total: string;
    status: string;
    orderDate: string;
    items: any;
  }>;
}

export function UserDetailNew() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadUserData(id);
    }
  }, [id]);

  const loadUserData = async (userId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('warungAuthToken')}`
        }
      });

      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load user details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">User not found</p>
        <Button onClick={() => navigate('/admin/users')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/users')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{data.user.warungNama}</h1>
          <p className="text-gray-600 mt-1">@{data.user.username}</p>
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Warung Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Warung Name</p>
              <p className="font-medium">{data.user.warungNama}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-medium">{data.user.warungAlamat || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Registered</p>
              <p className="font-medium">{new Date(data.user.createdAt).toLocaleDateString('id-ID')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.stats.totalRevenue)}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              From {data.stats.completedOrders} completed orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalOrders}</div>
            <p className="text-xs text-gray-600 mt-1">
              {data.stats.pendingOrders} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.menuItems}</div>
            <p className="text-xs text-gray-600 mt-1">Active menu items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.inventoryItems}</div>
            <p className="text-xs text-gray-600 mt-1">In stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Devices */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Devices ({data.devices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {data.devices.length === 0 ? (
            <p className="text-center text-gray-600 py-4">No devices registered</p>
          ) : (
            <div className="space-y-3">
              {data.devices.map((device) => (
                <div key={device.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{device.deviceName}</p>
                      <p className="text-sm text-gray-600">ID: {device.deviceId.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-gray-600">Last seen</p>
                    <p className="font-medium">
                      {device.lastSeenAt ? formatDateTime(new Date(device.lastSeenAt)) : 'Never'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentOrders.length === 0 ? (
            <p className="text-center text-gray-600 py-4">No orders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Table</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr key={order.id} className="border-b last:border-b-0">
                      <td className="py-3 px-4">{formatDateTime(new Date(order.orderDate))}</td>
                      <td className="py-3 px-4">{order.tableNumber || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold">{formatCurrency(parseFloat(order.total))}</td>
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
