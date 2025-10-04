import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Check, X, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { getTodayOrders, completeOrder, cancelOrder, Pesanan } from '@/lib/orders';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [loading, setLoading] = useState(true);

  // Alert dialog states
  const [alertOpen, setAlertOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    description: '',
    type: 'info' as 'info' | 'error' | 'success'
  });
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    description: '',
    onConfirm: () => {},
    confirmText: 'OK',
    variant: 'default' as 'default' | 'destructive'
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const showAlert = (title: string, description: string, type: 'info' | 'error' | 'success' = 'info') => {
    setAlertConfig({ title, description, type });
    setAlertOpen(true);
  };

  const showConfirm = (title: string, description: string, onConfirm: () => void, confirmText: string = 'OK', variant: 'default' | 'destructive' = 'default') => {
    setConfirmConfig({ title, description, onConfirm, confirmText, variant });
    setConfirmOpen(true);
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getTodayOrders();
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOrder = (orderId: number) => {
    showConfirm(
      'Selesaikan Pesanan',
      'Tandai pesanan ini sebagai selesai?',
      async () => {
        try {
          await completeOrder(orderId);
          await loadOrders();
          setConfirmOpen(false);
          showAlert('Berhasil!', 'Pesanan telah diselesaikan', 'success');
        } catch (error) {
          setConfirmOpen(false);
          showAlert('Gagal', 'Gagal menyelesaikan pesanan: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
        }
      },
      'Selesai',
      'default'
    );
  };

  const handleCancelOrder = (orderId: number) => {
    showConfirm(
      'Batalkan Pesanan',
      'Apakah Anda yakin ingin membatalkan pesanan ini?',
      async () => {
        try {
          await cancelOrder(orderId);
          await loadOrders();
          setConfirmOpen(false);
          showAlert('Berhasil!', 'Pesanan telah dibatalkan', 'success');
        } catch (error) {
          setConfirmOpen(false);
          showAlert('Gagal', 'Gagal membatalkan pesanan', 'error');
        }
      },
      'Batalkan',
      'destructive'
    );
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'completed':
        return <Badge variant="success"><Check className="mr-1 h-3 w-3" />Selesai</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><X className="mr-1 h-3 w-3" />Batal</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pesanan</h1>
          <p className="text-gray-600 mt-1">Kelola pesanan pelanggan</p>
        </div>
        <Link to="/orders/new">
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Buat Pesanan
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b">
        {[
          { key: 'all', label: 'Semua' },
          { key: 'pending', label: 'Pending' },
          { key: 'completed', label: 'Selesai' },
          { key: 'cancelled', label: 'Batal' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              filter === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Memuat pesanan...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">Tidak ada pesanan</p>
            <Link to="/orders/new">
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Buat Pesanan Pertama
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredOrders.map(order => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Pesanan #{order.id}
                      {order.nomorMeja && ` - Meja ${order.nomorMeja}`}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDateTime(order.tanggal)}
                    </p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>
                        {item.qty}x {item.menuNama}
                        {item.catatan && (
                          <span className="text-gray-500 italic ml-2">({item.catatan})</span>
                        )}
                      </span>
                      <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>

                {order.status === 'pending' && (
                  <div className="flex space-x-2 mt-4">
                    <Button
                      onClick={() => handleCompleteOrder(order.id!)}
                      className="flex-1"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Selesai
                    </Button>
                    <Button
                      onClick={() => handleCancelOrder(order.id!)}
                      variant="destructive"
                      className="flex-1"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Batal
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Alert Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>{alertConfig.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              onClick={() => setAlertOpen(false)}
              variant={alertConfig.type === 'error' ? 'destructive' : 'default'}
            >
              OK
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmConfig.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Batal
            </Button>
            <Button variant={confirmConfig.variant} onClick={confirmConfig.onConfirm}>
              {confirmConfig.confirmText}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
