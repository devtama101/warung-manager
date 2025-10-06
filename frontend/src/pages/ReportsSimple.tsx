import { useEffect, useState } from 'react';
import { ShoppingBag, Award, TrendingUp, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatNumber } from '@/lib/utils';
import { db } from '@/db/schema';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import { generateTodayReport } from '@/lib/reports';

interface DaySalesData {
  date: string;
  orders: number;
}

interface MenuPopularity {
  menuName: string;
  quantitySold: number;
}

export function ReportsSimple() {
  const [todayOrders, setTodayOrders] = useState(0);
  const [weeklyOrders, setWeeklyOrders] = useState(0);
  const [topSellingItem, setTopSellingItem] = useState('');
  const [avgOrdersPerDay, setAvgOrdersPerDay] = useState(0);
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
      const todayOrdersList = await db.orders
        .where('orderDate')
        .between(todayStart, todayEnd, true, true)
        .and(p => p.status === 'completed')
        .toArray();

      setTodayOrders(todayOrdersList.length);

      // Get last 7 days orders
      const weekOrdersList = await db.orders
        .where('orderDate')
        .between(weekAgo, todayEnd, true, true)
        .and(p => p.status === 'completed')
        .toArray();

      setWeeklyOrders(weekOrdersList.length);
      setAvgOrdersPerDay(weekOrdersList.length / 7);

      // Generate 7-day trend
      const trend: DaySalesData[] = [];
      for (let i = 6; i >= 0; i--) {
        const day = subDays(now, i);
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        const dayOrders = weekOrdersList.filter(
          order => order.orderDate >= dayStart && order.orderDate <= dayEnd
        );

        trend.push({
          date: format(day, 'dd MMM'),
          orders: dayOrders.length
        });
      }
      setTrendData(trend);

      // Calculate menu popularity
      const menuMap = new Map<string, number>();
      weekOrdersList.forEach(order => {
        order.items.forEach(item => {
          const current = menuMap.get(item.menuName) || 0;
          menuMap.set(item.menuName, current + item.quantity);
        });
      });

      const menuPopArray: MenuPopularity[] = Array.from(menuMap.entries())
        .map(([menuName, quantitySold]) => ({ menuName, quantitySold }))
        .sort((a, b) => b.quantitySold - a.quantitySold);

      setMenuPopularity(menuPopArray.slice(0, 10));
      setTopSellingItem(menuPopArray[0]?.menuName || '-');

    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      await generateTodayReport();
      alert('Laporan harian berhasil dibuat dan akan disinkronkan ke server');
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Gagal membuat laporan harian');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan Penjualan</h1>
          <p className="text-gray-600 mt-1">Statistik jumlah pesanan dan menu populer</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateReport}>
            <FileText className="mr-2 h-4 w-4" />
            Buat Laporan Harian
          </Button>
          <Button onClick={loadReports}>
            Muat Ulang Data
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Memuat laporan...</p>
        </div>
      ) : (
        <>
          {/* Today's Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Order Hari Ini
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
                  Order 7 Hari
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(weeklyOrders)}
                </div>
                <p className="text-xs text-gray-600 mt-1">total minggu ini</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Rata-rata Harian
                </CardTitle>
                <Clock className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {avgOrdersPerDay.toFixed(1)}
                </div>
                <p className="text-xs text-gray-600 mt-1">pesanan per hari</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Menu Terlaris
                </CardTitle>
                <Award className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-yellow-600 truncate">
                  {topSellingItem}
                </div>
                <p className="text-xs text-gray-600 mt-1">minggu ini</p>
              </CardContent>
            </Card>
          </div>

          {/* Popular Menu Items */}
          <Card>
            <CardHeader>
              <CardTitle>Menu Terpopuler (7 Hari Terakhir)</CardTitle>
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
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Jumlah Terjual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuPopularity.map((item, index) => (
                        <tr key={item.menuName} className="border-b last:border-b-0">
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
                          <td className="py-3 px-4 font-medium">{item.menuName}</td>
                          <td className="py-3 px-4 text-right font-bold text-blue-600">
                            {formatNumber(item.quantitySold)} porsi
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Box */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h3 className="font-medium text-blue-900 mb-2">ℹ️ Informasi</h3>
              <p className="text-sm text-blue-800">
                Laporan ini hanya menampilkan jumlah pesanan dan menu populer.
                Untuk informasi pendapatan dan keuntungan, silakan hubungi pemilik/admin warung.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
