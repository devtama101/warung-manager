import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Trash2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { getAvailableMenu } from '@/lib/menu';
import { Menu } from '@/lib/menu';
import { createOrder } from '@/lib/orders';
import { PesananItem } from '@/lib/orders';
import { formatCurrency } from '@/lib/utils';

interface OrderItem extends PesananItem {
  tempId: string;
}

export function NewOrder() {
  const navigate = useNavigate();
  const [menu, setMenu] = useState<Menu[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [nomorMeja, setNomorMeja] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Alert dialog states
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    description: '',
    type: 'info' as 'info' | 'error' | 'success',
    onConfirm: () => {}
  });

  useEffect(() => {
    loadMenu();
  }, []);

  const showAlert = (title: string, description: string, type: 'info' | 'error' | 'success' = 'info', onConfirm?: () => void) => {
    setAlertConfig({
      title,
      description,
      type,
      onConfirm: onConfirm || (() => setAlertOpen(false))
    });
    setAlertOpen(true);
  };

  const loadMenu = async () => {
    setLoading(true);
    try {
      const data = await getAvailableMenu();
      console.log('Loaded menu items:', data);
      setMenu(data);
    } catch (error) {
      console.error('Error loading menu:', error);
      showAlert('Gagal Memuat Menu', 'Pastikan sudah ada menu yang dibuat.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredMenu = menu.filter(item =>
    item.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToOrder = (menuItem: Menu) => {
    const existingItem = orderItems.find(item => item.menuId === menuItem.id!);

    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.menuId === menuItem.id!
          ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.harga }
          : item
      ));
    } else {
      setOrderItems([...orderItems, {
        tempId: crypto.randomUUID(),
        menuId: menuItem.id!,
        menuNama: menuItem.nama,
        qty: 1,
        harga: menuItem.harga,
        subtotal: menuItem.harga
      }]);
    }
  };

  const updateQuantity = (tempId: string, delta: number) => {
    setOrderItems(orderItems.map(item => {
      if (item.tempId === tempId) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty, subtotal: newQty * item.harga };
      }
      return item;
    }));
  };

  const removeItem = (tempId: string) => {
    setOrderItems(orderItems.filter(item => item.tempId !== tempId));
  };

  const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSubmit = async () => {
    if (orderItems.length === 0) {
      showAlert('Pesanan Kosong', 'Tambahkan minimal 1 item ke pesanan', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await createOrder({
        nomorMeja: nomorMeja || undefined,
        items: orderItems.map(item => ({
          menuId: item.menuId,
          menuNama: item.menuNama,
          qty: item.qty,
          harga: item.harga,
          subtotal: item.subtotal,
          catatan: item.catatan
        })),
        total,
        status: 'pending',
        tanggal: new Date()
      });

      showAlert('Berhasil!', 'Pesanan berhasil dibuat!', 'success', () => {
        setAlertOpen(false);
        navigate('/orders');
      });
    } catch (error) {
      console.error('Error creating order:', error);
      showAlert('Gagal', 'Gagal membuat pesanan: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/orders')}
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Buat Pesanan Baru</h1>
          <p className="text-gray-600 mt-1">Pilih menu untuk pesanan</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Menu List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pilih Menu</CardTitle>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="Cari menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-gray-600 py-8">Memuat menu...</p>
              ) : menu.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Belum ada menu tersedia</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Silakan buat menu terlebih dahulu di halaman Menu
                  </p>
                  <Button onClick={() => navigate('/menu')}>
                    Ke Halaman Menu
                  </Button>
                </div>
              ) : filteredMenu.length === 0 ? (
                <p className="text-center text-gray-600 py-8">
                  Tidak ada menu yang cocok dengan pencarian "{searchQuery}"
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMenu.map(item => (
                    <div
                      key={item.id}
                      onClick={() => addToOrder(item)}
                      className="p-4 border rounded-lg hover:border-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{item.nama}</h3>
                          <Badge variant="secondary" className="mt-1">
                            {item.kategori}
                          </Badge>
                        </div>
                        <span className="font-bold text-blue-600">
                          {formatCurrency(item.harga)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detail Pesanan</CardTitle>
              <Input
                type="text"
                placeholder="Nomor Meja (opsional)"
                value={nomorMeja}
                onChange={(e) => setNomorMeja(e.target.value)}
                className="mt-4"
              />
            </CardHeader>
            <CardContent>
              {orderItems.length === 0 ? (
                <p className="text-center text-gray-600 py-8">
                  Belum ada item
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {orderItems.map(item => (
                      <div key={item.tempId} className="flex items-center justify-between space-x-2 pb-3 border-b">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.menuNama}</p>
                          <p className="text-xs text-gray-600">{formatCurrency(item.harga)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => updateQuantity(item.tempId, -1)}
                            className="h-8 w-8"
                          >
                            <Minus size={14} />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.qty}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => updateQuantity(item.tempId, 1)}
                            className="h-8 w-8"
                          >
                            <Plus size={14} />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => removeItem(item.tempId)}
                            className="h-8 w-8"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between text-lg font-bold mb-4">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>

                    <Button
                      onClick={handleSubmit}
                      className="w-full"
                      size="lg"
                      disabled={submitting || orderItems.length === 0}
                    >
                      {submitting ? 'Membuat Pesanan...' : 'Buat Pesanan'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alert Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>{alertConfig.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              onClick={() => {
                alertConfig.onConfirm();
              }}
              variant={alertConfig.type === 'error' ? 'destructive' : 'default'}
            >
              OK
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
