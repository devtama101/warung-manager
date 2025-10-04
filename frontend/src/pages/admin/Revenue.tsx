import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Users, Calendar, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { getAllMenu } from '@/lib/menu';
import { db } from '@/db/schema';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, format } from 'date-fns';

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
      const { start, end } = getDateRange();

      // Get all completed orders in date range
      const orders = await db.pesanan
        .where('tanggal')
        .between(start, end, true, true)
        .and(p => p.status === 'completed')
        .toArray();

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
          <h1 className="text-3xl font-bold text-gray-900">Revenue Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive revenue insights across all users</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex space-x-2">
          <Button
            variant={timeRange === 'today' ? 'default' : 'outline'}
            onClick={() => setTimeRange('today')}
            size="sm"
          >
            Today
          </Button>
          <Button
            variant={timeRange === 'month' ? 'default' : 'outline'}
            onClick={() => setTimeRange('month')}
            size="sm"
          >
            This Month
          </Button>
          <Button
            variant={timeRange === '3months' ? 'default' : 'outline'}
            onClick={() => setTimeRange('3months')}
            size="sm"
          >
            3 Months
          </Button>
          <Button
            variant={timeRange === 'year' ? 'default' : 'outline'}
            onClick={() => setTimeRange('year')}
            size="sm"
          >
            Year
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                <p className="text-xs text-gray-600 mt-1">
                  {timeRange === 'today' ? 'today' : timeRange === 'month' ? 'this month' : `last ${timeRange === '3months' ? '3 months' : 'year'}`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(totalOrders)}</div>
                <p className="text-xs text-gray-600 mt-1">completed orders</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(avgOrderValue)}
                </div>
                <p className="text-xs text-gray-600 mt-1">per order</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{totalUsers}</div>
                <p className="text-xs text-gray-600 mt-1">unique devices</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trend (only for 3months/year view) */}
          {(timeRange === '3months' || timeRange === 'year') && (
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
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
                      name="Revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Revenue by User and Menu */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue by User */}
            <Card>
              <CardHeader>
                <CardTitle>Top Users by Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                {revenueByUser.length === 0 ? (
                  <p className="text-center text-gray-600 py-4">No data available</p>
                ) : (
                  <div className="space-y-3">
                    {revenueByUser.map((user, index) => (
                      <div
                        key={user.userId}
                        className="flex items-center justify-between py-3 border-b last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.userName}</p>
                            <p className="text-sm text-gray-600">
                              {formatNumber(user.totalOrders)} orders • {formatCurrency(user.avgOrderValue)}/order
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">
                            {formatCurrency(user.totalRevenue)}
                          </p>
                          <p className="text-xs text-gray-600">
                            {totalRevenue > 0
                              ? ((user.totalRevenue / totalRevenue) * 100).toFixed(1)
                              : '0'}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue by Menu - Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Menu Item</CardTitle>
              </CardHeader>
              <CardContent>
                {revenueByMenu.length === 0 ? (
                  <p className="text-center text-gray-600 py-4">No data available</p>
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
          </div>

          {/* Detailed Menu Revenue Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Menu Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueByMenu.length === 0 ? (
                <p className="text-center text-gray-600 py-4">No data available</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Menu Item</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Quantity</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Avg Price</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Total Revenue</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">% Share</th>
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
