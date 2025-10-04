import { useEffect, useState } from 'react';
import { Plus, Package, AlertTriangle, Edit, Trash2, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { getAllInventory, addInventory, updateInventory, updateStock, deleteInventory, getLowStockItems } from '@/lib/inventory';
import { Inventory as InventoryType } from '@/lib/inventory';
import { formatCurrency, formatNumber } from '@/lib/utils';

export function Inventory() {
  const [inventory, setInventory] = useState<InventoryType[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bahan_baku' | 'kemasan' | 'lainnya' | 'low'>('all');

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryType | null>(null);

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
    onConfirm: () => {}
  });

  // Form states
  const [formData, setFormData] = useState({
    nama: '',
    kategori: 'bahan_baku' as 'bahan_baku' | 'kemasan' | 'lainnya',
    stok: '',
    unit: '',
    stokMinimum: '',
    hargaBeli: '',
    supplier: ''
  });

  const [stockAdjustment, setStockAdjustment] = useState('');

  useEffect(() => {
    loadInventory();
  }, []);

  const showAlert = (title: string, description: string, type: 'info' | 'error' | 'success' = 'info') => {
    setAlertConfig({ title, description, type });
    setAlertOpen(true);
  };

  const showConfirm = (title: string, description: string, onConfirm: () => void) => {
    setConfirmConfig({ title, description, onConfirm });
    setConfirmOpen(true);
  };

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await getAllInventory();
      setInventory(data);

      const lowStock = await getLowStockItems();
      setLowStockItems(lowStock);
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'low') return item.stok < item.stokMinimum;
    return item.kategori === filter;
  });

  const getStockBadge = (item: InventoryType) => {
    if (item.stok === 0) {
      return <Badge variant="destructive">Habis</Badge>;
    } else if (item.stok < item.stokMinimum) {
      return <Badge variant="warning">Menipis</Badge>;
    }
    return <Badge variant="success">Tersedia</Badge>;
  };

  const resetForm = () => {
    setFormData({
      nama: '',
      kategori: 'bahan_baku',
      stok: '',
      unit: '',
      stokMinimum: '',
      hargaBeli: '',
      supplier: ''
    });
  };

  const handleAdd = async () => {
    try {
      await addInventory({
        nama: formData.nama,
        kategori: formData.kategori,
        stok: parseFloat(formData.stok),
        unit: formData.unit,
        stokMinimum: parseFloat(formData.stokMinimum),
        hargaBeli: parseFloat(formData.hargaBeli),
        supplier: formData.supplier || undefined,
        tanggalBeli: new Date()
      });

      setAddDialogOpen(false);
      resetForm();
      await loadInventory();
      showAlert('Berhasil!', 'Item berhasil ditambahkan', 'success');
    } catch (error) {
      showAlert('Gagal', 'Gagal menambah item', 'error');
    }
  };

  const handleEdit = (item: InventoryType) => {
    setSelectedItem(item);
    setFormData({
      nama: item.nama,
      kategori: item.kategori,
      stok: item.stok.toString(),
      unit: item.unit,
      stokMinimum: item.stokMinimum.toString(),
      hargaBeli: item.hargaBeli.toString(),
      supplier: item.supplier || ''
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem?.id) return;

    try {
      await updateInventory(selectedItem.id, {
        nama: formData.nama,
        kategori: formData.kategori,
        stok: parseFloat(formData.stok),
        unit: formData.unit,
        stokMinimum: parseFloat(formData.stokMinimum),
        hargaBeli: parseFloat(formData.hargaBeli),
        supplier: formData.supplier || undefined
      });

      setEditDialogOpen(false);
      setSelectedItem(null);
      resetForm();
      await loadInventory();
      showAlert('Berhasil!', 'Item berhasil diupdate', 'success');
    } catch (error) {
      showAlert('Gagal', 'Gagal mengupdate item', 'error');
    }
  };

  const handleDelete = (item: InventoryType) => {
    if (!item.id) return;

    showConfirm(
      'Hapus Item',
      `Apakah Anda yakin ingin menghapus "${item.nama}"?`,
      async () => {
        try {
          await deleteInventory(item.id!);
          await loadInventory();
          setConfirmOpen(false);
          showAlert('Berhasil!', 'Item berhasil dihapus', 'success');
        } catch (error) {
          setConfirmOpen(false);
          showAlert('Gagal', 'Gagal menghapus item', 'error');
        }
      }
    );
  };

  const handleStockAdjust = (item: InventoryType) => {
    setSelectedItem(item);
    setStockAdjustment('');
    setStockDialogOpen(true);
  };

  const handleStockUpdate = async (type: 'add' | 'reduce') => {
    if (!selectedItem?.id || !stockAdjustment) return;

    try {
      const delta = parseFloat(stockAdjustment) * (type === 'add' ? 1 : -1);
      await updateStock(selectedItem.id, delta, type === 'add' ? 'Tambah stok' : 'Kurangi stok');

      setStockDialogOpen(false);
      setSelectedItem(null);
      setStockAdjustment('');
      await loadInventory();
      showAlert('Berhasil!', 'Stok berhasil diupdate', 'success');
    } catch (error) {
      showAlert('Gagal', 'Gagal mengupdate stok: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600 mt-1">Kelola stok bahan dan barang</p>
        </div>
        <Button size="lg" onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-5 w-5" />
          Tambah Item
        </Button>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              {lowStockItems.length} Item Stok Menipis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="font-medium">{item.nama}</span>
                  <Badge variant="warning">
                    {formatNumber(item.stok)} {item.unit} (min: {formatNumber(item.stokMinimum)})
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b overflow-x-auto">
        {[
          { key: 'all', label: 'Semua' },
          { key: 'bahan_baku', label: 'Bahan Baku' },
          { key: 'kemasan', label: 'Kemasan' },
          { key: 'lainnya', label: 'Lainnya' },
          { key: 'low', label: 'Stok Menipis' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              filter === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Inventory List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Memuat inventory...</p>
        </div>
      ) : filteredInventory.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">Tidak ada item inventory</p>
            <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Item Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredInventory.map(item => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h3 className="text-lg font-semibold">{item.nama}</h3>
                      {getStockBadge(item)}
                      <Badge variant="secondary">{item.kategori.replace('_', ' ')}</Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Stok Saat Ini</p>
                        <p className="font-bold text-lg">
                          {formatNumber(item.stok)} {item.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Stok Minimum</p>
                        <p className="font-medium">
                          {formatNumber(item.stokMinimum)} {item.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Harga Beli</p>
                        <p className="font-medium">{formatCurrency(item.hargaBeli)}</p>
                      </div>
                      {item.supplier && (
                        <div>
                          <p className="text-gray-600">Supplier</p>
                          <p className="font-medium">{item.supplier}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleStockAdjust(item)}
                      title="Sesuaikan Stok"
                    >
                      <Plus size={18} />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleEdit(item)}
                      title="Edit"
                    >
                      <Edit size={18} />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(item)}
                      title="Hapus"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Item Inventory</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Item</label>
              <Input
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: Beras"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Kategori</label>
              <select
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                className="w-full h-10 rounded-md border border-gray-300 px-3"
              >
                <option value="bahan_baku">Bahan Baku</option>
                <option value="kemasan">Kemasan</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Stok Awal</label>
                <Input
                  type="number"
                  value={formData.stok}
                  onChange={(e) => setFormData({ ...formData, stok: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="kg, liter, pcs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Stok Minimum</label>
                <Input
                  type="number"
                  value={formData.stokMinimum}
                  onChange={(e) => setFormData({ ...formData, stokMinimum: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Harga Beli</label>
                <Input
                  type="number"
                  value={formData.hargaBeli}
                  onChange={(e) => setFormData({ ...formData, hargaBeli: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Supplier (Opsional)</label>
              <Input
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Nama supplier"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAdd}>Tambah</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item Inventory</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Item</label>
              <Input
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Kategori</label>
              <select
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                className="w-full h-10 rounded-md border border-gray-300 px-3"
              >
                <option value="bahan_baku">Bahan Baku</option>
                <option value="kemasan">Kemasan</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Stok</label>
                <Input
                  type="number"
                  value={formData.stok}
                  onChange={(e) => setFormData({ ...formData, stok: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Stok Minimum</label>
                <Input
                  type="number"
                  value={formData.stokMinimum}
                  onChange={(e) => setFormData({ ...formData, stokMinimum: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Harga Beli</label>
                <Input
                  type="number"
                  value={formData.hargaBeli}
                  onChange={(e) => setFormData({ ...formData, hargaBeli: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Supplier</label>
              <Input
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdate}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sesuaikan Stok - {selectedItem?.nama}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Stok saat ini:</p>
              <p className="text-2xl font-bold">
                {selectedItem && formatNumber(selectedItem.stok)} {selectedItem?.unit}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Jumlah</label>
              <Input
                type="number"
                value={stockAdjustment}
                onChange={(e) => setStockAdjustment(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleStockUpdate('reduce')}
              className="mr-auto"
            >
              <Minus className="mr-2 h-4 w-4" />
              Kurangi
            </Button>
            <Button variant="outline" onClick={() => setStockDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={() => handleStockUpdate('add')}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <Button variant="destructive" onClick={confirmConfig.onConfirm}>
              Hapus
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
