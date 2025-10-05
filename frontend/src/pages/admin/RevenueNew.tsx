import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Users, Target, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/utils';
import axios from 'axios';
import { db } from '@/db/schema';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface DaySalesData {
  date: string;
  pesanan: number;
  pendapatan: number;
  keuntungan: number;
}

interface RevenueData {
  totalRevenue: number;
  totalOrders: number;
  activeUsers: number;
  avgOrderValue: number;
  revenueByUser: Array<{
    userId: number;
    userName: string;
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
  }>;
  revenueByMenu: Array<{
    menuNama: string;
    totalRevenue: number;
    totalQty: number;
    avgPrice: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
}

export function RevenueNew() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | '7days' | 'month' | '3months' | 'year'>('month');
  const [data, setData] = useState<RevenueData | null>(null);
  const [trendData, setTrendData] = useState<DaySalesData[]>([]);
  const [localDataLoading, setLocalDataLoading] = useState(true);

  useEffect(() => {
    loadRevenueData();
  }, [timeRange]);

  useEffect(() => {
    loadTrendData();
  }, [timeRange]);

  const loadRevenueData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/admin/revenue?timeRange=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('warungAuthToken')}`
        }
      });

      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrendData = async () => {
    setLocalDataLoading(true);
    try {
      const now = new Date();
      const todayEnd = endOfDay(now);
      let startDate: Date;
      let dateFormat: string;
      let daysToInitialize: number;

      // Set date range based on timeRange
      switch (timeRange) {
        case 'today':
          startDate = startOfDay(now);
          dateFormat = 'HH:mm';
          daysToInitialize = 24; // Hourly data for today
          break;
        case '7days':
          startDate = startOfDay(subDays(now, 6));
          dateFormat = 'dd/MM';
          daysToInitialize = 7;
          break;
        case 'month':
          startDate = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
          dateFormat = 'dd/MM';
          daysToInitialize = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          break;
        case '3months':
          startDate = startOfDay(new Date(now.getFullYear(), now.getMonth() - 3, 1));
          dateFormat = 'dd/MM';
          daysToInitialize = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          break;
        case 'year':
          startDate = startOfDay(new Date(now.getFullYear(), 0, 1));
          dateFormat = 'MMM';
          daysToInitialize = 12; // Monthly data for year
          break;
        default:
          startDate = startOfDay(subDays(now, 6));
          dateFormat = 'dd/MM';
          daysToInitialize = 7;
      }

      // Get all menu items for profit calculation
      const allMenu = await db.menu.toArray();
      const menuProfitMap = new Map();

      // Calculate profit per menu with validation
      allMenu.forEach(menu => {
        const harga = Number(menu.harga) || 0;
        const hargaModal = Number(menu.hargaModal) || 0;

        // Ensure hargaModal is not greater than harga and both are valid numbers
        if (harga > 0 && hargaModal >= 0 && hargaModal <= harga) {
          const profitPerItem = harga - hargaModal;
          menuProfitMap.set(menu.nama, profitPerItem);
          console.log(`Menu: ${menu.nama}, Harga: ${harga}, Modal: ${hargaModal}, Profit/item: ${profitPerItem}`);
        } else {
          console.warn(`Invalid pricing for menu ${menu.nama}: Harga=${harga}, Modal=${hargaModal}`);
          menuProfitMap.set(menu.nama, 0);
        }
      });

      // Calculate profit for an array of orders
      const calculateOrderProfit = (orders: any[]) => {
        return orders.reduce((totalProfit, order) => {
          const orderProfit = order.items.reduce((orderTotal: number, item: any) => {
            const profitPerItem = menuProfitMap.get(item.menuNama) || 0;
            return orderTotal + (profitPerItem * item.qty);
          }, 0);
          return totalProfit + orderProfit;
        }, 0);
      };

      // Get orders based on time range - try multiple approaches
      let ordersList = await db.pesanan
        .where('tanggal')
        .between(startDate, todayEnd, true, true)
        .and(p => p.status === 'completed')
        .toArray();

      // If no orders found with 'completed', try other common statuses
      if (ordersList.length === 0) {
        ordersList = await db.pesanan
          .where('tanggal')
          .between(startDate, todayEnd, true, true)
          .and(p => p.status === 'selesai')
          .toArray();
      }

      // Still no orders? Try without status filter
      if (ordersList.length === 0) {
        ordersList = await db.pesanan
          .where('tanggal')
          .between(startDate, todayEnd, true, true)
          .toArray();
      }

      // Initialize trend data structure
      const trendMap = new Map<string, { pesanan: number; pendapatan: number; keuntungan: number }>();

      // Initialize all periods with zero values
      if (timeRange === 'today') {
        // Initialize hourly data for today
        for (let i = 0; i < 24; i++) {
          const hour = i.toString().padStart(2, '0') + ':00';
          trendMap.set(hour, { pesanan: 0, pendapatan: 0, keuntungan: 0 });
        }
      } else if (timeRange === 'year') {
        // Initialize monthly data for year
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        for (let i = 0; i <= now.getMonth(); i++) {
          trendMap.set(months[i], { pesanan: 0, pendapatan: 0, keuntungan: 0 });
        }
      } else {
        // Initialize daily data for other ranges
        for (let i = daysToInitialize - 1; i >= 0; i--) {
          let date: Date;
          if (timeRange === '7days') {
            date = subDays(now, i);
          } else {
            date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
          }
          const dateKey = format(date, dateFormat);
          trendMap.set(dateKey, { pesanan: 0, pendapatan: 0, keuntungan: 0 });
        }
      }

      // Calculate stats for each period
      ordersList.forEach(order => {
        let periodKey: string;

        if (timeRange === 'today') {
          periodKey = format(order.tanggal, 'HH') + ':00';
        } else if (timeRange === 'year') {
          periodKey = format(order.tanggal, 'MMM');
        } else {
          periodKey = format(order.tanggal, dateFormat);
        }

        const current = trendMap.get(periodKey) || { pesanan: 0, pendapatan: 0, keuntungan: 0 };

        current.pesanan += 1;
        current.pendapatan += order.total;

        // Calculate profit for this order
        const orderProfit = order.items.reduce((orderTotal: number, item: any) => {
          const profitPerItem = menuProfitMap.get(item.menuNama) || 0;
          const itemTotalProfit = profitPerItem * (Number(item.qty) || 0);

          // Debug log for each item
          if (profitPerItem > 0) {
            console.log(`Item: ${item.menuNama}, Qty: ${item.qty}, Profit/item: ${profitPerItem}, Total: ${itemTotalProfit}`);
          } else if (profitPerItem === 0 && item.menuNama) {
            console.warn(`Menu not found or zero profit: ${item.menuNama}`);
          }

          return orderTotal + itemTotalProfit;
        }, 0);

        // Validate that order profit doesn't exceed order revenue
        const validOrderProfit = Math.min(orderProfit, order.total);
        if (orderProfit > order.total) {
          console.warn(`Order profit (${orderProfit}) exceeds order revenue (${order.total}), capping at revenue`);
        }

        current.keuntungan += validOrderProfit;

        trendMap.set(periodKey, current);
      });

      const trendArray: DaySalesData[] = Array.from(trendMap.entries())
        .map(([date, data]) => {
          // Final validation: ensure profit doesn't exceed revenue
          const validKeuntungan = Math.min(data.keuntungan, data.pendapatan);

          if (data.keuntungan > data.pendapatan) {
            console.warn(`Period ${date}: Profit (${data.keuntungan}) exceeds Revenue (${data.pendapatan}), capping profit at revenue`);
          }

          return {
            date,
            pesanan: data.pesanan,
            pendapatan: data.pendapatan,
            keuntungan: validKeuntungan
          };
        });

      // Log final totals for debugging
      const totalRevenue = trendArray.reduce((sum, day) => sum + day.pendapatan, 0);
      const totalProfit = trendArray.reduce((sum, day) => sum + day.keuntungan, 0);
      console.log(`Final totals - Revenue: ${totalRevenue}, Profit: ${totalProfit}, Margin: ${totalRevenue > 0 ? (totalProfit/totalRevenue*100).toFixed(1) : 0}%`);

      setTrendData(trendArray);
    } catch (error) {
      console.error('Failed to load trend data:', error);
    } finally {
      setLocalDataLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const getTrendChartTitle = () => {
    switch (timeRange) {
      case 'today':
        return 'Tren Pendapatan & Keuntungan Hari Ini (Per Jam)';
      case '7days':
        return 'Tren Pendapatan & Keuntungan 7 Hari Terakhir';
      case 'month':
        return 'Tren Pendapatan & Keuntungan Bulan Ini';
      case '3months':
        return 'Tren Pendapatan & Keuntungan 3 Bulan Terakhir';
      case 'year':
        return 'Tren Pendapatan & Keuntungan Tahun Ini (Per Bulan)';
      default:
        return 'Tren Pendapatan & Keuntungan';
    }
  };

  const getOrderChartTitle = () => {
    switch (timeRange) {
      case 'today':
        return 'Jumlah Pesanan Hari Ini (Per Jam)';
      case '7days':
        return 'Jumlah Pesanan 7 Hari Terakhir';
      case 'month':
        return 'Jumlah Pesanan Bulan Ini';
      case '3months':
        return 'Jumlah Pesanan 3 Bulan Terakhir';
      case 'year':
        return 'Jumlah Pesanan Tahun Ini (Per Bulan)';
      default:
        return 'Jumlah Pesanan';
    }
  };

  const getMonthlyTrendTitle = () => {
    switch (timeRange) {
      case '3months':
        return 'Tren Pendapatan 3 Bulan Terakhir';
      case 'year':
        return 'Tren Pendapatan Tahun Ini';
      default:
        return 'Tren Pendapatan';
    }
  };

  // Calculate total profit from trend data
  const getTotalProfit = () => {
    const totalProfit = trendData.reduce((total, day) => total + day.keuntungan, 0);
    const totalRevenue = trendData.reduce((total, day) => total + day.pendapatan, 0);

    // Ensure profit never exceeds revenue
    const validProfit = Math.min(totalProfit, totalRevenue);

    if (totalProfit > totalRevenue) {
      console.warn(`Total profit (${totalProfit}) exceeds total revenue (${totalRevenue}), capping profit at revenue`);
    }

    return validProfit;
  };

  // Calculate profit margin
  const getProfitMargin = () => {
    const totalRevenue = trendData.reduce((total, day) => total + day.pendapatan, 0);
    const totalProfit = getTotalProfit();
    if (totalRevenue === 0) return 0;
    return (totalProfit / totalRevenue) * 100;
  };

  // Calculate profit per menu
  const getMenuWithProfit = () => {
    const allMenu = db.menu.toArray();
    return data.revenueByMenu.map(item => {
      const menuProfitMap = new Map();
      // This would need to be calculated from order data
      // For now, we'll estimate profit based on typical margins
      const estimatedMargin = 0.3; // 30% typical margin
      const estimatedProfit = item.totalRevenue * estimatedMargin;
      return {
        ...item,
        estimatedProfit,
        profitMargin: estimatedMargin * 100
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analisis Pendapatan</h1>
          <p className="text-gray-600 mt-1">Laporan pendapatan dan penjualan warung</p>
        </div>

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
            variant={timeRange === '7days' ? 'default' : 'outline'}
            onClick={() => setTimeRange('7days')}
            size="sm"
          >
            7 Hari
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
      ) : !data ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No data available</p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                <DollarSign className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
                <p className="text-xs text-gray-600 mt-1">
                  {timeRange === 'today' ? 'hari ini' : timeRange === 'month' ? 'bulan ini' : `${timeRange === '3months' ? '3 bulan terakhir' : 'tahun ini'}`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Keuntungan</CardTitle>
                <Target className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{formatCurrency(getTotalProfit())}</div>
                <p className="text-xs text-gray-600 mt-1">
                  {timeRange === 'today' ? 'hari ini' : timeRange === 'month' ? 'bulan ini' : `${timeRange === '3months' ? '3 bulan terakhir' : 'tahun ini'}`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                <Percent className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {getProfitMargin().toFixed(1)}%
                </div>
                <p className="text-xs text-gray-600 mt-1">margin keuntungan</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(data.totalOrders)}</div>
                <p className="text-xs text-gray-600 mt-1">pesanan selesai</p>
              </CardContent>
            </Card>
          </div>

          {/* Profit Analysis Summary */}
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg text-purple-900">Ringkasan Analisis Keuntungan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{formatCurrency(getTotalProfit())}</div>
                  <p className="text-sm text-gray-600 mt-1">Total Keuntungan</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{getProfitMargin().toFixed(1)}%</div>
                  <p className="text-sm text-gray-600 mt-1">Profit Margin</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {trendData.length > 0 ? formatCurrency(getTotalProfit() / trendData.length) : formatCurrency(0)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Rata-rata Keuntungan per Periode</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {data.totalOrders > 0 ? formatCurrency(getTotalProfit() / data.totalOrders) : formatCurrency(0)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Keuntungan per Pesanan</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue & Profit Trend Chart */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">{getTrendChartTitle()}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 sm:pt-2">
              {localDataLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Memuat data tren...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250} minHeight={200}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="pendapatan"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Pendapatan"
                    />
                    <Line
                      type="monotone"
                      dataKey="keuntungan"
                      stroke="#9333ea"
                      strokeWidth={2}
                      name="Keuntungan"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Orders Trend Chart */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">{getOrderChartTitle()}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 sm:pt-2">
              {localDataLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Memuat data tren...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250} minHeight={200}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="pesanan" fill="#10b981" name="Jumlah Pesanan" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Monthly Trend (only for 3months/year view) */}
          {(timeRange === '3months' || timeRange === 'year') && data.monthlyRevenue.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{getMonthlyTrendTitle()}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.monthlyRevenue}>
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
              {data.revenueByMenu.length === 0 ? (
                <p className="text-center text-gray-600 py-4">Tidak ada data</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.revenueByMenu.slice(0, 8)}
                      dataKey="totalRevenue"
                      nameKey="menuNama"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.menuNama} (${((entry.totalRevenue / data.totalRevenue) * 100).toFixed(0)}%)`}
                    >
                      {data.revenueByMenu.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Detailed Menu Revenue & Profit Table */}
          <Card>
            <CardHeader>
              <CardTitle>Analisis Keuntungan Menu</CardTitle>
            </CardHeader>
            <CardContent>
              {data.revenueByMenu.length === 0 ? (
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
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Estimasi Keuntungan</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Margin</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">% Kontribusi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.revenueByMenu.map((item, index) => {
                        const estimatedMargin = 0.3; // 30% typical margin
                        const estimatedProfit = item.totalRevenue * estimatedMargin;

                        return (
                          <tr key={index} className="border-b last:border-b-0">
                            <td className="py-3 px-4 font-medium">{item.menuNama}</td>
                            <td className="py-3 px-4 text-right">{formatNumber(item.totalQty)}</td>
                            <td className="py-3 px-4 text-right">{formatCurrency(item.avgPrice)}</td>
                            <td className="py-3 px-4 text-right font-bold text-blue-600">
                              {formatCurrency(item.totalRevenue)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-purple-600">
                              {formatCurrency(estimatedProfit)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {(estimatedMargin * 100).toFixed(0)}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right text-gray-600">
                              {data.totalRevenue > 0
                                ? ((item.totalRevenue / data.totalRevenue) * 100).toFixed(1)
                                : '0'}%
                            </td>
                          </tr>
                        );
                      })}
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
