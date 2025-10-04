import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTodayOrders } from '@/lib/orders';
import { getLowStockItems } from '@/lib/inventory';
import { getReportByDate } from '@/lib/reports';
import { formatCurrency } from '@/lib/utils';

export function Dashboard() {
  const [todayOrders, setTodayOrders] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [todayProfit, setTodayProfit] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Load today's orders
    const orders = await getTodayOrders();
    const completedOrders = orders.filter(o => o.status === 'completed');
    setTodayOrders(completedOrders.length);

    const revenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    setTodayRevenue(revenue);

    // Load low stock items
    const lowStock = await getLowStockItems();
    setLowStockCount(lowStock.length);

    // Load today's report
    const report = await getReportByDate(new Date());
    setTodayProfit(report?.keuntungan || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Selamat datang di Warung POS</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pesanan Hari Ini
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayOrders}</div>
            <p className="text-xs text-gray-600 mt-1">pesanan selesai</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendapatan Hari Ini
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(todayRevenue)}</div>
            <p className="text-xs text-gray-600 mt-1">total penjualan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Keuntungan Hari Ini
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(todayProfit)}</div>
            <p className="text-xs text-gray-600 mt-1">laba bersih</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Stok Menipis
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
            <p className="text-xs text-gray-600 mt-1">item perlu restock</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/orders/new">
            <Button className="w-full" size="lg">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Buat Pesanan Baru
            </Button>
          </Link>
          <Link to="/inventory">
            <Button variant="outline" className="w-full" size="lg">
              <Package className="mr-2 h-5 w-5" />
              Kelola Inventory
            </Button>
          </Link>
          <Link to="/reports">
            <Button variant="outline" className="w-full" size="lg">
              <TrendingUp className="mr-2 h-5 w-5" />
              Lihat Laporan
            </Button>
          </Link>
        </CardContent>
      </Card>

      {lowStockCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Peringatan Stok
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-800">
              Ada {lowStockCount} item dengan stok menipis. Segera lakukan restock!
            </p>
            <Link to="/inventory">
              <Button variant="outline" className="mt-4">
                Lihat Detail
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
