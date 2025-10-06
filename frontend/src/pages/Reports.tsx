import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { generateTodayReport, get7DayTrend, getMenuRevenueBreakdown, DailyReport, MenuRevenueData } from '@/lib/reports';
import { formatCurrency, formatNumber } from '@/lib/utils';

export function Reports() {
  const [todayReport, setTodayReport] = useState<DailyReport | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [menuRevenueData, setMenuRevenueData] = useState<MenuRevenueData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const today = await generateTodayReport();
      setTodayReport(today);

      const trend = await get7DayTrend();
      setTrendData(trend);

      const menuRevenue = await getMenuRevenueBreakdown();
      setMenuRevenueData(menuRevenue);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan</h1>
          <p className="text-gray-600 mt-1">Analisis performa penjualan</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Penjualan
                </CardTitle>
                <DollarSign className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(todayReport?.totalSales || 0)}
                </div>
                <p className="text-xs text-gray-600 mt-1">hari ini</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Keuntungan
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(todayReport?.profit || 0)}
                </div>
                <p className="text-xs text-gray-600 mt-1">laba bersih</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Jumlah Order
                </CardTitle>
                <ShoppingBag className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(todayReport?.totalOrders || 0)}
                </div>
                <p className="text-xs text-gray-600 mt-1">pesanan selesai</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Item Terlaris
                </CardTitle>
                <Award className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold truncate">
                  {todayReport?.bestSellingItem || 'N/A'}
                </div>
                <p className="text-xs text-gray-600 mt-1">menu favorit</p>
              </CardContent>
            </Card>
          </div>

          {/* Trend Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Trend Pendapatan 7 Hari</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
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

            <Card>
              <CardHeader>
                <CardTitle>Trend Keuntungan 7 Hari</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Keuntungan"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Jumlah Order 7 Hari</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="orders" fill="#3b82f6" name="Order" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detail Laporan Hari Ini</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Total Pendapatan</span>
                    <span className="font-bold">{formatCurrency(todayReport?.totalSales || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Total Modal (COGS)</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(todayReport?.totalCost || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Laba Bersih</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(todayReport?.profit || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Margin Keuntungan</span>
                    <span className="font-medium">
                      {todayReport?.totalSales
                        ? ((todayReport.profit / todayReport.totalSales) * 100).toFixed(1)
                        : '0'}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Menu Revenue Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Pendapatan per Menu Hari Ini</CardTitle>
            </CardHeader>
            <CardContent>
              {menuRevenueData.length === 0 ? (
                <p className="text-center text-gray-600 py-4">Belum ada penjualan hari ini</p>
              ) : (
                <div className="space-y-3">
                  {menuRevenueData.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-3 border-b last:border-b-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.menuName}</p>
                        <p className="text-sm text-gray-600">
                          {formatNumber(item.totalQty)} terjual • {formatCurrency(item.avgPrice)}/item
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">
                          {formatCurrency(item.totalRevenue)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {todayReport?.totalSales
                            ? ((item.totalRevenue / todayReport.totalSales) * 100).toFixed(1)
                            : '0'}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
