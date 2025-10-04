import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, ShoppingCart, Package, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getUserById, getUserStats } from '@/lib/admin/mockData';
import { User, UserStats } from '@/lib/admin/types';
import { formatCurrency, formatNumber } from '@/lib/utils';

export function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadUserData(id);
    }
  }, [id]);

  const loadUserData = async (userId: string) => {
    setLoading(true);
    try {
      const [userData, userStats] = await Promise.all([
        getUserById(userId),
        Promise.resolve(getUserStats(userId))
      ]);
      setUser(userData || null);
      setStats(userStats);
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

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">User not found</p>
        <Button onClick={() => navigate('/admin/users')} className="mt-4">
          Back to Users
        </Button>
      </div>
    );
  }

  const daysUntilExpiry = Math.ceil((new Date(user.subscriptionEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/admin/users')}
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{user.warungNama}</h1>
          <p className="text-gray-600 mt-1">User details and statistics</p>
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Warung Name</p>
              <p className="font-semibold text-lg">{user.warungNama}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Owner Name</p>
              <p className="font-semibold">{user.ownerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Email</p>
              <p className="font-semibold">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Phone</p>
              <p className="font-semibold">{user.phone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Plan Type</p>
              <Badge className={
                user.planType === 'enterprise' ? 'bg-yellow-500' :
                user.planType === 'premium' ? 'bg-purple-500' :
                user.planType === 'basic' ? 'bg-blue-500' : 'bg-gray-500'
              }>
                {user.planType.toUpperCase()}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <Badge variant={
                user.subscriptionStatus === 'active' ? 'success' :
                user.subscriptionStatus === 'trial' ? 'warning' : 'destructive'
              }>
                {user.subscriptionStatus.toUpperCase()}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Subscription Start</p>
              <p className="font-semibold">{new Date(user.subscriptionStart).toLocaleDateString('id-ID')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Subscription End</p>
              <p className="font-semibold">{new Date(user.subscriptionEnd).toLocaleDateString('id-ID')}</p>
              {daysUntilExpiry > 0 && (
                <p className="text-xs text-gray-500 mt-1">{daysUntilExpiry} days remaining</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Devices</p>
              <p className="font-semibold">{user.deviceCount} device(s)</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Account Created</p>
              <p className="font-semibold">{new Date(user.createdAt).toLocaleDateString('id-ID')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Last Active</p>
              <p className="font-semibold">{new Date(user.lastActive).toLocaleDateString('id-ID')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                <p className="text-xs text-gray-600 mt-1">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.totalOrders)}</div>
                <p className="text-xs text-gray-600 mt-1">
                  {stats.ordersThisMonth} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.averageOrderValue)}</div>
                <p className="text-xs text-gray-600 mt-1">Per order</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.growthRate > 0 ? '+' : ''}{stats.growthRate.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-600 mt-1">Month over month</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Menu Items</span>
                    </div>
                    <span className="font-semibold">{stats.totalMenuItems}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Inventory Items</span>
                    </div>
                    <span className="font-semibold">{stats.totalInventoryItems}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Revenue This Month</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(stats.revenueThisMonth)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <ShoppingCart className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Orders This Month</span>
                    </div>
                    <span className="font-semibold">{stats.ordersThisMonth}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full" variant="outline">
                    Extend Subscription
                  </Button>
                  <Button className="w-full" variant="outline">
                    Change Plan
                  </Button>
                  <Button className="w-full" variant="outline">
                    Send Notification
                  </Button>
                  <Button className="w-full" variant="destructive" disabled>
                    Suspend Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
