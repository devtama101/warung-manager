import { useEffect, useState } from 'react';
import { ShoppingBag, Award, TrendingUp, Clock, DollarSign, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatNumber, formatCurrency } from '@/lib/utils';
import { db } from '@/db/schema';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

interface DaySalesData {
  date: string;
  pesanan: number;
  pendapatan: number;
  keuntungan: number;
}

interface MenuPopularity {
  menuNama: string;
  jumlahTerjual: number;
  totalPendapatan: number;
  totalKeuntungan: number;
}

export function AdminReports() {
  const [todayOrders, setTodayOrders] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayProfit, setTodayProfit] = useState(0);
  const [weeklyOrders, setWeeklyOrders] = useState(0);
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [weeklyProfit, setWeeklyProfit] = useState(0);
  const [topSellingItem, setTopSellingItem] = useState('');
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [trendData, setTrendData] = useState<DaySalesData[]>([]);
  const [menuPopularity, setMenuPopularity] = useState<MenuPopularity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      const weekAgo = startOfDay(subDays(now, 6));

      // Get today's orders
      const todayOrdersList = await db.pesanan
        .where('tanggal')
        .between(todayStart, todayEnd, true, true)
        .and(p => p.status === 'completed')
        .toArray();

      setTodayOrders(todayOrdersList.length);

      const todayRev = todayOrdersList.reduce((sum, order) => sum + order.total, 0);
      const todayPrf = todayOrdersList.reduce((sum, order) => sum + order.keuntungan, 0);
      setTodayRevenue(todayRev);
      setTodayProfit(todayPrf);

      // Get last 7 days orders
      const weekOrdersList = await db.pesanan
        .where('tanggal')
        .between(weekAgo, todayEnd, true, true)
        .and(p => p.status === 'completed')
        .toArray();

      setWeeklyOrders(weekOrdersList.length);

      const weekRev = weekOrdersList.reduce((sum, order) => sum + order.total, 0);
      const weekPrf = weekOrdersList.reduce((sum, order) => sum + order.keuntungan, 0);
      setWeeklyRevenue(weekRev);
      setWeeklyProfit(weekPrf);
      setAvgOrderValue(weekOrdersList.length > 0 ? weekRev / weekOrdersList.length : 0);

      // Generate 7-day trend
      const trend: DaySalesData[] = [];
      for (let i = 6; i >= 0; i--) {
        const day = subDays(now, i);
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        const dayOrders = weekOrdersList.filter(
          order => order.tanggal >= dayStart && order.tanggal <= dayEnd
        );

        const dayRevenue = dayOrders.reduce((sum, order) => sum + order.total, 0);
        const dayProfit = dayOrders.reduce((sum, order) => sum + order.keuntungan, 0);

        trend.push({
          date: format(day, 'dd MMM'),
          pesanan: dayOrders.length,
          pendapatan: dayRevenue,
          keuntungan: dayProfit
        });
      }
      setTrendData(trend);

      // Calculate menu popularity with revenue and profit
      const menuMap = new Map<string, { qty: number; revenue: number; profit: number }>();

      // Get all menu items to calculate profit
      const allMenu = await db.menu.toArray();
      const menuProfitMap = new Map(allMenu.map(m => [m.nama, m.harga - m.hargaModal]));

      weekOrdersList.forEach(order => {
        order.items.forEach(item => {
          const current = menuMap.get(item.menuNama) || { qty: 0, revenue: 0, profit: 0 };
          const itemRevenue = item.harga * item.qty;
          const profitPerItem = menuProfitMap.get(item.menuNama) || 0;
          const itemProfit = profitPerItem * item.qty;

          menuMap.set(item.menuNama, {
            qty: current.qty + item.qty,
            revenue: current.revenue + itemRevenue,
            profit: current.profit + itemProfit
          });
        });
      });

      const menuPopArray: MenuPopularity[] = Array.from(menuMap.entries())
        .map(([menuNama, data]) => ({
          menuNama,
          jumlahTerjual: data.qty,
          totalPendapatan: data.revenue,
          totalKeuntungan: data.profit
        }))
        .sort((a, b) => b.totalPendapatan - a.totalPendapatan);

      setMenuPopularity(menuPopArray.slice(0, 10));
      setTopSellingItem(menuPopArray[0]?.menuNama || '-');

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan Lengkap</h1>
          <p className="text-gray-600 mt-1">Analisis penjualan, pendapatan, dan keuntungan warung</p>
        </div>
        <Button onClick={loadReports}>
          Refresh Data
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Memuat laporan...</p>
        </div>
      ) : (
        <>
          {/* Today's Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pesanan Hari Ini
                </CardTitle>
                <ShoppingBag className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(todayOrders)}
                </div>
                <p className="text-xs text-gray-600 mt-1">pesanan selesai</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pendapatan Hari Ini
                </CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(todayRevenue)}
                </div>
                <p className="text-xs text-gray-600 mt-1">total penjualan</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Keuntungan Hari Ini
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(todayProfit)}
                </div>
                <p className="text-xs text-gray-600 mt-1">profit bersih</p>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pesanan 7 Hari
                </CardTitle>
                <Package className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(weeklyOrders)}
                </div>
                <p className="text-xs text-gray-600 mt-1">total minggu ini</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pendapatan 7 Hari
                </CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(weeklyRevenue)}
                </div>
                <p className="text-xs text-gray-600 mt-1">total penjualan</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Keuntungan 7 Hari
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(weeklyProfit)}
                </div>
                <p className="text-xs text-gray-600 mt-1">profit minggu ini</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Rata-rata per Pesanan
                </CardTitle>
                <Clock className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(avgOrderValue)}
                </div>
                <p className="text-xs text-gray-600 mt-1">nilai rata-rata</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue & Profit Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Tren Pendapatan & Keuntungan 7 Hari Terakhir</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
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
            </CardContent>
          </Card>

          {/* Orders Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Jumlah Pesanan 7 Hari Terakhir</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="pesanan" fill="#10b981" name="Jumlah Pesanan" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Popular Menu Items with Revenue & Profit */}
          <Card>
            <CardHeader>
              <CardTitle>Menu Terpopuler dengan Analisis Keuangan (7 Hari Terakhir)</CardTitle>
            </CardHeader>
            <CardContent>
              {menuPopularity.length === 0 ? (
                <p className="text-center text-gray-600 py-8">Belum ada data penjualan</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Peringkat</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Nama Menu</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Terjual</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Pendapatan</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Keuntungan</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuPopularity.map((item, index) => {
                        const margin = item.totalPendapatan > 0
                          ? (item.totalKeuntungan / item.totalPendapatan) * 100
                          : 0;

                        return (
                          <tr key={item.menuNama} className="border-b last:border-b-0">
                            <td className="py-3 px-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                                index === 0 ? 'bg-yellow-500' :
                                index === 1 ? 'bg-gray-400' :
                                index === 2 ? 'bg-orange-600' :
                                'bg-blue-500'
                              }`}>
                                {index + 1}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium">{item.menuNama}</td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-bold text-green-600">
                                {formatNumber(item.jumlahTerjual)} porsi
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-blue-600">
                              {formatCurrency(item.totalPendapatan)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-purple-600">
                              {formatCurrency(item.totalKeuntungan)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`font-semibold ${
                                margin >= 50 ? 'text-green-600' :
                                margin >= 30 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {margin.toFixed(1)}%
                              </span>
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

          {/* Top Selling Item Info */}
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Award className="h-12 w-12 text-yellow-600" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Menu Terlaris Minggu Ini</h3>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{topSellingItem}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Item paling populer dalam 7 hari terakhir
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
