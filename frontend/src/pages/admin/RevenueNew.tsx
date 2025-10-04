import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/utils';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
  const [timeRange, setTimeRange] = useState<'today' | 'month' | '3months' | 'year'>('month');
  const [data, setData] = useState<RevenueData | null>(null);

  useEffect(() => {
    loadRevenueData();
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

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(data.totalOrders)}</div>
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
                  {formatCurrency(data.avgOrderValue)}
                </div>
                <p className="text-xs text-gray-600 mt-1">per pesanan</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trend (only for 3months/year view) */}
          {(timeRange === '3months' || timeRange === 'year') && data.monthlyRevenue.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Trend Pendapatan</CardTitle>
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

          {/* Detailed Menu Revenue Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detail Pendapatan Menu</CardTitle>
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
                        <th className="text-right py-3 px-4 font-medium text-gray-600">% Kontribusi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.revenueByMenu.map((item, index) => (
                        <tr key={index} className="border-b last:border-b-0">
                          <td className="py-3 px-4 font-medium">{item.menuNama}</td>
                          <td className="py-3 px-4 text-right">{formatNumber(item.totalQty)}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(item.avgPrice)}</td>
                          <td className="py-3 px-4 text-right font-bold text-blue-600">
                            {formatCurrency(item.totalRevenue)}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            {data.totalRevenue > 0
                              ? ((item.totalRevenue / data.totalRevenue) * 100).toFixed(1)
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
