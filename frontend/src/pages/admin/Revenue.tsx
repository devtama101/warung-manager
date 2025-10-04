import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Users, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { db } from '@/db/schema';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, format } from 'date-fns';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

interface RevenueByUser {
  userId: string;
  userName: string;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
}

interface RevenueByMenu {
  menuNama: string;
  totalRevenue: number;
  totalQty: number;
  avgPrice: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  orders: number;
}

export function Revenue() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'today' | 'month' | '3months' | 'year'>('month');

  // Stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  // Charts data
  const [revenueByUser, setRevenueByUser] = useState<RevenueByUser[]>([]);
  const [revenueByMenu, setRevenueByMenu] = useState<RevenueByMenu[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);

  useEffect(() => {
    loadRevenueData();
  }, [timeRange]);

  const refreshDataFromBackend = async () => {
    setRefreshing(true);
    await loadRevenueData();
    setRefreshing(false);
  };

  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case '3months':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case 'year':
        return { start: startOfMonth(subMonths(now, 11)), end: endOfMonth(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const loadRevenueData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminAuthToken');
      if (token) {
        // Try to load from backend first
        const response = await axios.get(`${API_BASE_URL}/api/admin/revenue`, {
          params: { timeRange },
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const backendData = response.data.data;

          // Update stats with backend data
          setTotalRevenue(backendData.totalRevenue);
          setTotalOrders(backendData.totalOrders);
          setAvgOrderValue(backendData.avgOrderValue);
          setTotalUsers(backendData.activeUsers);

          // Transform backend data to match frontend format
          const userRevenueFormatted = backendData.revenueByUser.map((user: any) => ({
            userId: user.userId.toString(),
            userName: user.userName,
            totalRevenue: user.totalRevenue,
            totalOrders: user.totalOrders,
            avgOrderValue: user.avgOrderValue
          }));

          const menuRevenueFormatted = backendData.revenueByMenu.map((menu: any) => ({
            menuNama: menu.menuNama,
            totalRevenue: menu.totalRevenue,
            totalQty: menu.totalQty,
            avgPrice: menu.avgPrice
          }));

          setRevenueByUser(userRevenueFormatted);
          setRevenueByMenu(menuRevenueFormatted);
          setMonthlyRevenue(backendData.monthlyRevenue);

          console.log('Revenue data loaded from backend');
          return;
        }
      }
    } catch (error) {
      console.error('Backend load failed, using local data:', error);
    }

    try {
      // Fallback to local data
      const { start, end } = getDateRange();

      // Get all orders and filter manually to avoid key range issues
      const allOrders = await db.pesanan.toArray();
      const orders = allOrders.filter(order =>
        order.tanggal >= start &&
        order.tanggal <= end &&
        order.status === 'completed'
      );

      // Calculate total stats
      const revenue = orders.reduce((sum, o) => sum + o.total, 0);
      setTotalRevenue(revenue);
      setTotalOrders(orders.length);
      setAvgOrderValue(orders.length > 0 ? revenue / orders.length : 0);

      // Get unique users (using deviceId as a proxy for users)
      const uniqueUsers = new Set(orders.map(o => o.deviceId));
      setTotalUsers(uniqueUsers.size);

      // Calculate revenue by user (device)
      const userRevenueMap = new Map<string, { revenue: number; orders: number }>();
      orders.forEach(order => {
        const existing = userRevenueMap.get(order.deviceId) || { revenue: 0, orders: 0 };
        userRevenueMap.set(order.deviceId, {
          revenue: existing.revenue + order.total,
          orders: existing.orders + 1
        });
      });

      const userRevenue: RevenueByUser[] = Array.from(userRevenueMap.entries())
        .map(([userId, data]) => ({
          userId,
          userName: `Device ${userId.slice(0, 8)}`,
          totalRevenue: data.revenue,
          totalOrders: data.orders,
          avgOrderValue: data.revenue / data.orders
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10); // Top 10 users

      setRevenueByUser(userRevenue);

      // Calculate revenue by menu
      const menuRevenueMap = new Map<string, { qty: number; revenue: number }>();
      orders.forEach(order => {
        order.items.forEach(item => {
          const existing = menuRevenueMap.get(item.menuNama) || { qty: 0, revenue: 0 };
          menuRevenueMap.set(item.menuNama, {
            qty: existing.qty + item.qty,
            revenue: existing.revenue + item.subtotal
          });
        });
      });

      const menuRevenue: RevenueByMenu[] = Array.from(menuRevenueMap.entries())
        .map(([menuNama, data]) => ({
          menuNama,
          totalRevenue: data.revenue,
          totalQty: data.qty,
          avgPrice: data.revenue / data.qty
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

      setRevenueByMenu(menuRevenue);

      // Calculate monthly revenue trend
      if (timeRange === '3months' || timeRange === 'year') {
        const months = timeRange === '3months' ? 3 : 12;
        const monthlyData: MonthlyRevenue[] = [];

        for (let i = months - 1; i >= 0; i--) {
          const monthStart = startOfMonth(subMonths(new Date(), i));
          const monthEnd = endOfMonth(subMonths(new Date(), i));

          const monthOrders = orders.filter(
            o => o.tanggal >= monthStart && o.tanggal <= monthEnd
          );

          monthlyData.push({
            month: format(monthStart, 'MMM yyyy'),
            revenue: monthOrders.reduce((sum, o) => sum + o.total, 0),
            orders: monthOrders.length
          });
        }

        setMonthlyRevenue(monthlyData);
      }
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analisis Pendapatan</h1>
          <p className="text-gray-600 mt-1">Laporan pendapatan dan penjualan warung</p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshDataFromBackend}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Memuat...' : 'Refresh'}
          </Button>

          {/* Time Range Selector */}
          <div className="flex space-x-2">
          <Button
            variant={timeRange === 'today' ? 'default' : 'outline'}
            onClick={() => setTimeRange('today')}
            size="sm"
          >
            Hari Ini
          </Button>
          <Button
            variant={timeRange === 'month' ? 'default' : 'outline'}
            onClick={() => setTimeRange('month')}
            size="sm"
          >
            Bulan Ini
          </Button>
          <Button
            variant={timeRange === '3months' ? 'default' : 'outline'}
            onClick={() => setTimeRange('3months')}
            size="sm"
          >
            3 Bulan
          </Button>
          <Button
            variant={timeRange === 'year' ? 'default' : 'outline'}
            onClick={() => setTimeRange('year')}
            size="sm"
          >
            Tahun Ini
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading revenue data...</p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                <DollarSign className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                <p className="text-xs text-gray-600 mt-1">
                  {timeRange === 'today' ? 'hari ini' : timeRange === 'month' ? 'bulan ini' : `${timeRange === '3months' ? '3 bulan terakhir' : 'tahun ini'}`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(totalOrders)}</div>
                <p className="text-xs text-gray-600 mt-1">pesanan selesai</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rata-rata Pesanan</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(avgOrderValue)}
                </div>
                <p className="text-xs text-gray-600 mt-1">per pesanan</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trend (only for 3months/year view) */}
          {(timeRange === '3months' || timeRange === 'year') && (
            <Card>
              <CardHeader>
                <CardTitle>Trend Pendapatan</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Pendapatan"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Revenue by Menu */}
          <Card>
            <CardHeader>
              <CardTitle>Pendapatan per Menu</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueByMenu.length === 0 ? (
                <p className="text-center text-gray-600 py-4">Tidak ada data</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueByMenu.slice(0, 8)}
                      dataKey="totalRevenue"
                      nameKey="menuNama"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.menuNama} (${((entry.totalRevenue / totalRevenue) * 100).toFixed(0)}%)`}
                    >
                      {revenueByMenu.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Detailed Menu Revenue Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detail Pendapatan Menu</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueByMenu.length === 0 ? (
                <p className="text-center text-gray-600 py-4">Tidak ada data</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Menu</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Jumlah Terjual</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Harga Rata-rata</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Total Pendapatan</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">% Kontribusi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueByMenu.map((item, index) => (
                        <tr key={index} className="border-b last:border-b-0">
                          <td className="py-3 px-4 font-medium">{item.menuNama}</td>
                          <td className="py-3 px-4 text-right">{formatNumber(item.totalQty)}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(item.avgPrice)}</td>
                          <td className="py-3 px-4 text-right font-bold text-blue-600">
                            {formatCurrency(item.totalRevenue)}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            {totalRevenue > 0
                              ? ((item.totalRevenue / totalRevenue) * 100).toFixed(1)
                              : '0'}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
