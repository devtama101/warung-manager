import { useEffect, useState } from 'react';
import { Search, Filter, Eye, Clock, CheckCircle, XCircle, AlertCircle, Calendar, DollarSign, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '@/lib/utils';
import axios from 'axios';
import { subDays, format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface OrderItem {
  menuId: number;
  menuNama: string;
  qty: number;
  harga: number;
  subtotal: number;
  catatan?: string;
}

interface Order {
  id: number;
  localId: number;
  nomorMeja: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  tanggal: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  deviceId: string;
  userName?: string;
  deviceName?: string;
}

interface FilterState {
  search: string;
  status: string;
  dateRange: 'today' | '7days' | '30days' | 'all';
  sortBy: 'tanggal' | 'total' | 'status';
  sortOrder: 'asc' | 'desc';
}

export function OrderMonitoring() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    dateRange: '7days',
    sortBy: 'tanggal',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });

  useEffect(() => {
    loadOrders();
  }, [filters, pagination.page]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('warungAuthToken');
      const response = await axios.get(`${API_URL}/api/admin/orders`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          search: filters.search,
          status: filters.status !== 'all' ? filters.status : undefined,
          dateRange: filters.dateRange,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          page: pagination.page,
          limit: pagination.limit
        }
      });

      if (response.data.success) {
        setOrders(response.data.data.orders);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.total
        }));
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      // If API fails, load from local database
      loadOrdersFromLocal();
    } finally {
      setLoading(false);
    }
  };

  const loadOrdersFromLocal = async () => {
    try {
      const db = await import('@/db/schema');
      const now = new Date();
      let startDate: Date;

      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case '7days':
          startDate = subDays(now, 7);
          break;
        case '30days':
          startDate = subDays(now, 30);
          break;
        case 'all':
        default:
          startDate = new Date(0); // Beginning of time
      }

      let localOrders = await db.default.pesanan
        .where('tanggal')
        .between(startDate, now, true, true)
        .toArray();

      // Apply filters
      if (filters.search) {
        localOrders = localOrders.filter(order =>
          order.nomorMeja?.toLowerCase().includes(filters.search.toLowerCase()) ||
          order.items.some(item => item.menuNama.toLowerCase().includes(filters.search.toLowerCase()))
        );
      }

      if (filters.status !== 'all') {
        localOrders = localOrders.filter(order => order.status === filters.status);
      }

      // Sort
      localOrders.sort((a, b) => {
        let comparison = 0;
        switch (filters.sortBy) {
          case 'tanggal':
            comparison = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
            break;
          case 'total':
            comparison = a.total - b.total;
            break;
          case 'status':
            comparison = a.status.localeCompare(b.status);
            break;
        }
        return filters.sortOrder === 'asc' ? comparison : -comparison;
      });

      // Apply pagination
      const startIndex = (pagination.page - 1) * pagination.limit;
      const paginatedOrders = localOrders.slice(startIndex, startIndex + pagination.limit);

      setOrders(paginatedOrders as Order[]);
      setPagination(prev => ({
        ...prev,
        total: localOrders.length
      }));
    } catch (error) {
      console.error('Failed to load orders from local:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Selesai';
      case 'cancelled':
        return 'Dibatalkan';
      case 'pending':
        return 'Menunggu';
      default:
        return status;
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('warungAuthToken');
      const response = await axios.patch(`${API_URL}/api/admin/orders/${orderId}/status`, {
        status: newStatus
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Update local state
        setOrders(prev => prev.map(order =>
          order.id === orderId ? { ...order, status: newStatus as any } : order
        ));
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      // Update locally if API fails
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, status: newStatus as any } : order
      ));
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus as any } : null);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monitoring Pesanan</h1>
          <p className="text-gray-600 mt-1">Pantau semua pesanan dari berbagai warung</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <User className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(pagination.total)}</div>
            <p className="text-xs text-gray-600 mt-1"> keseluruhan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatNumber(orders.filter(o => o.status === 'pending').length)}
            </div>
            <p className="text-xs text-gray-600 mt-1">perlu diproses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(orders.filter(o => o.status === 'completed').length)}
            </div>
            <p className="text-xs text-gray-600 mt-1">berhasil</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dibatalkan</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatNumber(orders.filter(o => o.status === 'cancelled').length)}
            </div>
            <p className="text-xs text-gray-600 mt-1">gagal</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Cari Pesanan</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nomor meja atau menu..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Rentang Tanggal</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Hari Ini</option>
                <option value="7days">7 Hari Terakhir</option>
                <option value="30days">30 Hari Terakhir</option>
                <option value="all">Semua Waktu</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Urutkan</label>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  setFilters(prev => ({ ...prev, sortBy: sortBy as any, sortOrder: sortOrder as any }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="tanggal-desc">Terbaru</option>
                <option value="tanggal-asc">Terlama</option>
                <option value="total-desc">Total Tertinggi</option>
                <option value="total-asc">Total Terendah</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Memuat data pesanan...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Tidak ada pesanan ditemukan</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Tanggal</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Meja</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Items</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Total</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">#{order.localId || order.id}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {format(new Date(order.tanggal), 'dd/MM/yyyy HH:mm')}
                        </td>
                        <td className="py-3 px-4">{order.nomorMeja || '-'}</td>
                        <td className="py-3 px-4">
                          <div className="max-w-xs">
                            <p className="text-sm truncate">
                              {order.items.slice(0, 2).map(item => `${item.menuNama} (${item.qty})`).join(', ')}
                              {order.items.length > 2 && ` +${order.items.length - 2} lainnya`}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center">
                            <Badge className={getStatusColor(order.status)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(order.status)}
                                <span>{getStatusText(order.status)}</span>
                              </div>
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewOrder(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {order.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, 'completed')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Menampilkan {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} pesanan
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <span className="px-3 py-1 text-sm">
                      Halaman {pagination.page} dari {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                      disabled={pagination.page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Detail Pesanan #{selectedOrder.localId || selectedOrder.id}</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetailModal(false)}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Tanggal</p>
                    <p className="font-medium">{format(new Date(selectedOrder.tanggal), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Meja</p>
                    <p className="font-medium">{selectedOrder.nomorMeja || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(selectedOrder.status)}
                        <span>{getStatusText(selectedOrder.status)}</span>
                      </div>
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="font-bold text-lg">{formatCurrency(selectedOrder.total)}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold mb-2">Item Pesanan</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{item.menuNama}</p>
                          <p className="text-sm text-gray-600">{item.qty} x {formatCurrency(item.harga)}</p>
                          {item.catatan && (
                            <p className="text-sm text-gray-500 italic">Catatan: {item.catatan}</p>
                          )}
                        </div>
                        <p className="font-bold">{formatCurrency(item.subtotal)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedOrder.status === 'pending' && (
                  <div className="flex space-x-2 pt-4 border-t">
                    <Button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'completed');
                        setShowDetailModal(false);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Tandai Selesai
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'cancelled');
                        setShowDetailModal(false);
                      }}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Batalkan
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}