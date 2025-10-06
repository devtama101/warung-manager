import { useEffect, useState } from 'react';
import { ShoppingBag, Award, TrendingUp, Clock, DollarSign, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatNumber, formatCurrency } from '@/lib/utils';
import { db } from '@/db/schema';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

interface MenuPopularity {
  menuName: string;
  quantitySold: number;
  totalRevenue: number;
  totalProfit: number;
}

export function AdminDashboard() {
  const [todayOrders, setTodayOrders] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayProfit, setTodayProfit] = useState(0);
  const [weeklyOrders, setWeeklyOrders] = useState(0);
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [weeklyProfit, setWeeklyProfit] = useState(0);
  const [topSellingItem, setTopSellingItem] = useState('');
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [menuPopularity, setMenuPopularity] = useState<MenuPopularity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Laporan Lengkap - Warung Manager';
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      const weekAgo = startOfDay(subDays(now, 6));

      // Get all menu items for profit calculation
      const allMenu = await db.menuItems.toArray();
      const menuProfitMap = new Map(allMenu.map(m => [m.name, m.price - m.costPrice]));

      // Calculate profit for an array of orders
      const calculateOrderProfit = (orders: any[]) => {
        return orders.reduce((totalProfit, order) => {
          const orderProfit = order.items.reduce((orderTotal: number, item: any) => {
            const profitPerItem = menuProfitMap.get(item.menuName) || 0;
            return orderTotal + (profitPerItem * item.quantity);
          }, 0);
          return totalProfit + orderProfit;
        }, 0);
      };

      // Get today's orders - try multiple approaches
      let todayOrdersList = await db.orders
        .where('orderDate')
        .between(todayStart, todayEnd, true, true)
        .and(p => p.status === 'completed')
        .toArray();

      // If no orders found with 'completed', try other common statuses
      if (todayOrdersList.length === 0) {
        todayOrdersList = await db.orders
          .where('orderDate')
          .between(todayStart, todayEnd, true, true)
          .and(p => p.status === 'completed')
          .toArray();
      }

      // Still no orders? Try without status filter
      if (todayOrdersList.length === 0) {
        todayOrdersList = await db.orders
          .where('orderDate')
          .between(todayStart, todayEnd, true, true)
          .toArray();
      }

      setTodayOrders(todayOrdersList.length);

      const todayRev = todayOrdersList.reduce((sum, order) => sum + order.total, 0);
      const todayPrf = calculateOrderProfit(todayOrdersList);
      setTodayRevenue(todayRev);
      setTodayProfit(todayPrf);

      // Get last 7 days orders - try multiple approaches
      let weekOrdersList = await db.orders
        .where('orderDate')
        .between(weekAgo, todayEnd, true, true)
        .and(p => p.status === 'completed')
        .toArray();

      // If no orders found with 'completed', try other common statuses
      if (weekOrdersList.length === 0) {
        weekOrdersList = await db.orders
          .where('orderDate')
          .between(weekAgo, todayEnd, true, true)
          .and(p => p.status === 'completed')
          .toArray();
      }

      // Still no orders? Try without status filter
      if (weekOrdersList.length === 0) {
        weekOrdersList = await db.orders
          .where('orderDate')
          .between(weekAgo, todayEnd, true, true)
          .toArray();
      }

      setWeeklyOrders(weekOrdersList.length);

      const weekRev = weekOrdersList.reduce((sum, order) => sum + order.total, 0);
      const weekPrf = calculateOrderProfit(weekOrdersList);
      setWeeklyRevenue(weekRev);
      setWeeklyProfit(weekPrf);
      setAvgOrderValue(weekOrdersList.length > 0 ? weekRev / weekOrdersList.length : 0);

      // Calculate menu popularity with revenue and profit
      const menuMap = new Map<string, { qty: number; revenue: number; profit: number }>();

      weekOrdersList.forEach(order => {
        order.items.forEach(item => {
          const current = menuMap.get(item.menuName) || { qty: 0, revenue: 0, profit: 0 };
          const itemRevenue = item.price * item.quantity;
          const profitPerItem = menuProfitMap.get(item.menuName) || 0;
          const itemProfit = profitPerItem * item.quantity;

          menuMap.set(item.menuName, {
            qty: current.qty + item.quantity,
            revenue: current.revenue + itemRevenue,
            profit: current.profit + itemProfit
          });
        });
      });

      const menuPopArray: MenuPopularity[] = Array.from(menuMap.entries())
        .map(([menuName, data]) => ({
          menuName,
          quantitySold: data.qty,
          totalRevenue: data.revenue,
          totalProfit: data.profit
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

      setMenuPopularity(menuPopArray.slice(0, 10));
      setTopSellingItem(menuPopArray[0]?.menuName || '-');

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Laporan Lengkap</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Analisis penjualan, pendapatan, dan keuntungan warung</p>
        </div>
        <Button onClick={loadReports} className="w-full sm:w-auto">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Order Hari Ini
                </CardTitle>
                <ShoppingBag className="h-4 w-4 text-green-600 flex-shrink-0" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {formatNumber(todayOrders)}
                </div>
                <p className="text-xs text-gray-600 mt-1">pesanan selesai</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Pendapatan Hari Ini
                </CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600 flex-shrink-0" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {formatCurrency(todayRevenue)}
                </div>
                <p className="text-xs text-gray-600 mt-1">total penjualan</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Keuntungan Hari Ini
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600 flex-shrink-0" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">
                  {formatCurrency(todayProfit)}
                </div>
                <p className="text-xs text-gray-600 mt-1">profit bersih</p>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Order 7 Hari
                </CardTitle>
                <Package className="h-4 w-4 text-gray-600 flex-shrink-0" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-lg sm:text-2xl font-bold">
                  {formatNumber(weeklyOrders)}
                </div>
                <p className="text-xs text-gray-600 mt-1">total minggu ini</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Pendapatan 7 Hari
                </CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600 flex-shrink-0" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-lg sm:text-2xl font-bold text-blue-600">
                  {formatCurrency(weeklyRevenue)}
                </div>
                <p className="text-xs text-gray-600 mt-1">total penjualan</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Keuntungan 7 Hari
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600 flex-shrink-0" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-lg sm:text-2xl font-bold text-purple-600">
                  {formatCurrency(weeklyProfit)}
                </div>
                <p className="text-xs text-gray-600 mt-1">profit minggu ini</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Rata-rata per Order
                </CardTitle>
                <Clock className="h-4 w-4 text-green-600 flex-shrink-0" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-lg sm:text-2xl font-bold text-green-600">
                  {formatCurrency(avgOrderValue)}
                </div>
                <p className="text-xs text-gray-600 mt-1">nilai rata-rata</p>
              </CardContent>
            </Card>
          </div>

  
          {/* Top Selling Item and Popular Menu - Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Top Selling Item Info - Left */}
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 h-full">
              <CardContent className="p-4 sm:p-6 h-full flex flex-col justify-center">
                <div className="text-center space-y-3 sm:space-y-4">
                  <div className="flex justify-center">
                    <Award className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-lg text-gray-900 mb-2">Menu Terlaris Minggu Ini</h3>
                    <p className="text-xl sm:text-3xl font-bold text-yellow-600 mb-2 sm:mb-3 break-words">{topSellingItem}</p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Item paling populer dalam 7 hari terakhir
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Popular Menu Items with Revenue & Profit - Right */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Menu Terpopuler dengan Analisis Keuangan (7 Hari Terakhir)</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 sm:pt-2">
                {menuPopularity.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">Belum ada data penjualan</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[500px]">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">Peringkat</th>
                          <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">Nama Menu</th>
                          <th className="text-right py-2 px-2 sm:py-3 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">Terjual</th>
                          <th className="text-right py-2 px-2 sm:py-3 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">Pendapatan</th>
                          <th className="text-right py-2 px-2 sm:py-3 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">Keuntungan</th>
                          <th className="text-right py-2 px-2 sm:py-3 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">Margin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {menuPopularity.map((item, index) => {
                          const margin = item.totalRevenue > 0
                            ? (item.totalProfit / item.totalRevenue) * 100
                            : 0;

                          return (
                            <tr key={item.menuName} className="border-b last:border-b-0">
                              <td className="py-2 px-2 sm:py-3 sm:px-4">
                                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-white text-xs sm:text-sm ${
                                  index === 0 ? 'bg-yellow-500' :
                                  index === 1 ? 'bg-gray-400' :
                                  index === 2 ? 'bg-orange-600' :
                                  'bg-blue-500'
                                }`}>
                                  {index + 1}
                                </div>
                              </td>
                              <td className="py-2 px-2 sm:py-3 sm:px-4 font-medium text-xs sm:text-sm">{item.menuName}</td>
                              <td className="py-2 px-2 sm:py-3 sm:px-4 text-right">
                                <span className="font-bold text-green-600 text-xs sm:text-sm">
                                  {formatNumber(item.quantitySold)} porsi
                                </span>
                              </td>
                              <td className="py-2 px-2 sm:py-3 sm:px-4 text-right font-bold text-blue-600 text-xs sm:text-sm">
                                {formatCurrency(item.totalRevenue)}
                              </td>
                              <td className="py-2 px-2 sm:py-3 sm:px-4 text-right font-bold text-purple-600 text-xs sm:text-sm">
                                {formatCurrency(item.totalProfit)}
                              </td>
                              <td className="py-2 px-2 sm:py-3 sm:px-4 text-right">
                                <span className={`font-semibold text-xs sm:text-sm ${
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
          </div>
        </>
      )}
    </div>
  );
}