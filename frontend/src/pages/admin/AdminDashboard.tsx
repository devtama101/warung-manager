import { useEffect, useState } from 'react';
import { Users, TrendingUp, DollarSign, UserCheck, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminStats, getRevenueData } from '@/lib/admin/mockData';
import { AdminDashboardStats, RevenueData } from '@/lib/admin/types';
import { formatCurrency } from '@/lib/utils';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Dashboard Admin - Warung POS';
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, revenue] = await Promise.all([
        getAdminStats(),
        getRevenueData()
      ]);
      setStats(statsData);
      setRevenueData(revenue);
    } finally {
      setLoading(false);
    }
  };

  const planDistributionData = stats ? [
    { name: 'Free', value: stats.planDistribution.free, color: '#94a3b8' },
    { name: 'Basic', value: stats.planDistribution.basic, color: '#3b82f6' },
    { name: 'Premium', value: stats.planDistribution.premium, color: '#8b5cf6' },
    { name: 'Enterprise', value: stats.planDistribution.enterprise, color: '#eab308' }
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Memuat...</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-600 mt-1">Ringkasan semua pengguna dan pendapatan</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-green-600 mt-1">
              +{stats.newUsersThisMonth} bulan ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pengguna Aktif</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-gray-600 mt-1">
              {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% dari total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRecurringRevenue)}</div>
            <p className="text-xs text-gray-600 mt-1">Pendapatan Berulang Bulanan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-gray-600 mt-1">Sepanjang waktu</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tren Pendapatan (6 Bulan Terakhir)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
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

        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Pertumbuhan vs Kehilangan Pengguna</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="newUsers" fill="#10b981" name="Pengguna Baru" />
                <Bar dataKey="churnedUsers" fill="#ef4444" name="Pengguna Keluar" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution and Stats */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Plan Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Paket</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={planDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {planDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Additional Stats */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Metrik Utama</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <UserCheck className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Pengguna Aktif</span>
                </div>
                <p className="text-3xl font-bold">{stats.activeUsers}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% tingkat aktif
                </p>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">Pengguna Trial</span>
                </div>
                <p className="text-3xl font-bold">{stats.trialUsers}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Potensi konversi
                </p>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <UserX className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-gray-600">Tingkat Keluar</span>
                </div>
                <p className="text-3xl font-bold">{stats.churnRate}%</p>
                <p className="text-sm text-gray-500 mt-1">
                  Rata-rata bulanan
                </p>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-600">Pertumbuhan</span>
                </div>
                <p className="text-3xl font-bold">+{stats.newUsersThisMonth}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Pengguna baru bulan ini
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
