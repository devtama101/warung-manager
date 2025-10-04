import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, ChefHat } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { getAllMenu, addMenu, updateMenu, deleteMenu, toggleMenuAvailability } from '@/lib/menu';
import { getAllInventory } from '@/lib/inventory';
import { Menu as MenuType } from '@/lib/menu';
import { Inventory } from '@/lib/inventory';
import { formatCurrency } from '@/lib/utils';

export function Menu() {
  const [menuItems, setMenuItems] = useState<MenuType[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'makanan' | 'minuman' | 'snack'>('all');

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuType | null>(null);

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
    kategori: 'makanan' as 'makanan' | 'minuman' | 'snack',
    harga: '',
    tersedia: true,
    ingredients: [] as Array<{ inventoryId: number; inventoryNama: string; qty: string; unit: string }>
  });

  useEffect(() => {
    loadData();
  }, []);

  const showAlert = (title: string, description: string, type: 'info' | 'error' | 'success' = 'info') => {
    setAlertConfig({ title, description, type });
    setAlertOpen(true);
  };

  const showConfirm = (title: string, description: string, onConfirm: () => void) => {
    setConfirmConfig({ title, description, onConfirm });
    setConfirmOpen(true);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [menuData, inventoryData] = await Promise.all([
        getAllMenu(),
        getAllInventory()
      ]);
      setMenuItems(menuData);
      setInventory(inventoryData);
    } finally {
      setLoading(false);
    }
  };

  const filteredMenu = menuItems.filter(item => {
    if (filter === 'all') return true;
    return item.kategori === filter;
  });

  const resetForm = () => {
    setFormData({
      nama: '',
      kategori: 'makanan',
      harga: '',
      tersedia: true,
      ingredients: []
    });
  };

  const handleAdd = async () => {
    try {
      await addMenu({
        nama: formData.nama,
        kategori: formData.kategori,
        harga: parseFloat(formData.harga),
        tersedia: formData.tersedia,
        ingredients: formData.ingredients.map(ing => ({
          inventoryId: ing.inventoryId,
          inventoryNama: ing.inventoryNama,
          qty: parseFloat(ing.qty),
          unit: ing.unit
        }))
      });

      setAddDialogOpen(false);
      resetForm();
      await loadData();
      showAlert('Berhasil!', 'Menu berhasil ditambahkan', 'success');
    } catch (error) {
      showAlert('Gagal', 'Gagal menambah menu', 'error');
    }
  };

  const handleEdit = (item: MenuType) => {
    setSelectedItem(item);
    setFormData({
      nama: item.nama,
      kategori: item.kategori,
      harga: item.harga.toString(),
      tersedia: item.tersedia,
      ingredients: item.ingredients.map(ing => ({
        inventoryId: ing.inventoryId,
        inventoryNama: ing.inventoryNama,
        qty: ing.qty.toString(),
        unit: ing.unit
      }))
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem?.id) return;

    try {
      await updateMenu(selectedItem.id, {
        nama: formData.nama,
        kategori: formData.kategori,
        harga: parseFloat(formData.harga),
        tersedia: formData.tersedia,
        ingredients: formData.ingredients.map(ing => ({
          inventoryId: ing.inventoryId,
          inventoryNama: ing.inventoryNama,
          qty: parseFloat(ing.qty),
          unit: ing.unit
        }))
      });

      setEditDialogOpen(false);
      setSelectedItem(null);
      resetForm();
      await loadData();
      showAlert('Berhasil!', 'Menu berhasil diupdate', 'success');
    } catch (error) {
      showAlert('Gagal', 'Gagal mengupdate menu', 'error');
    }
  };

  const handleDelete = (item: MenuType) => {
    if (!item.id) return;

    showConfirm(
      'Hapus Menu',
      `Apakah Anda yakin ingin menghapus "${item.nama}"?`,
      async () => {
        try {
          await deleteMenu(item.id!);
          await loadData();
          setConfirmOpen(false);
          showAlert('Berhasil!', 'Menu berhasil dihapus', 'success');
        } catch (error) {
          setConfirmOpen(false);
          showAlert('Gagal', 'Gagal menghapus menu', 'error');
        }
      }
    );
  };

  const handleToggleAvailability = async (item: MenuType) => {
    if (!item.id) return;

    try {
      await toggleMenuAvailability(item.id);
      await loadData();
    } catch (error) {
      showAlert('Gagal', 'Gagal mengubah status menu', 'error');
    }
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { inventoryId: 0, inventoryNama: '', qty: '', unit: '' }]
    });
  };

  const removeIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index)
    });
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const newIngredients = [...formData.ingredients];

    if (field === 'inventoryId') {
      const selectedInventory = inventory.find(inv => inv.id === parseInt(value));
      if (selectedInventory) {
        newIngredients[index] = {
          ...newIngredients[index],
          inventoryId: selectedInventory.id!,
          inventoryNama: selectedInventory.nama,
          unit: selectedInventory.unit
        };
      }
    } else {
      newIngredients[index] = { ...newIngredients[index], [field]: value };
    }

    setFormData({ ...formData, ingredients: newIngredients });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu</h1>
          <p className="text-gray-600 mt-1">Kelola daftar menu makanan dan minuman</p>
        </div>
        <Button size="lg" onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-5 w-5" />
          Tambah Menu
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b overflow-x-auto">
        {[
          { key: 'all', label: 'Semua' },
          { key: 'makanan', label: 'Makanan' },
          { key: 'minuman', label: 'Minuman' },
          { key: 'snack', label: 'Snack' }
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

      {/* Menu List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Memuat menu...</p>
        </div>
      ) : filteredMenu.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ChefHat className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">Tidak ada menu</p>
            <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Menu Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenu.map(item => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{item.nama}</h3>
                    <Badge variant="secondary" className="mt-1">
                      {item.kategori}
                    </Badge>
                  </div>
                  <Badge variant={item.tersedia ? 'success' : 'destructive'}>
                    {item.tersedia ? 'Tersedia' : 'Habis'}
                  </Badge>
                </div>

                <div className="mb-4">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(item.harga)}
                  </p>
                </div>

                {item.ingredients.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-600 mb-2">Bahan:</p>
                    <div className="space-y-1">
                      {item.ingredients.map((ing, idx) => (
                        <p key={idx} className="text-sm text-gray-600">
                          • {ing.inventoryNama} ({ing.qty} {ing.unit})
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleAvailability(item)}
                    className="flex-1"
                  >
                    {item.tersedia ? 'Tandai Habis' : 'Tersedia'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={addDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setAddDialogOpen(false);
          setEditDialogOpen(false);
          setSelectedItem(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editDialogOpen ? 'Edit Menu' : 'Tambah Menu'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Menu</label>
              <Input
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: Nasi Goreng"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Kategori</label>
                <select
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                  className="w-full h-10 rounded-md border border-gray-300 px-3"
                >
                  <option value="makanan">Makanan</option>
                  <option value="minuman">Minuman</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Harga</label>
                <Input
                  type="number"
                  value={formData.harga}
                  onChange={(e) => setFormData({ ...formData, harga: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="tersedia"
                checked={formData.tersedia}
                onChange={(e) => setFormData({ ...formData, tersedia: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="tersedia" className="text-sm font-medium">
                Tersedia untuk dijual
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Bahan/Ingredients</label>
                <Button size="sm" variant="outline" onClick={addIngredient}>
                  <Plus className="mr-1 h-3 w-3" />
                  Tambah Bahan
                </Button>
              </div>

              <div className="space-y-2">
                {formData.ingredients.map((ing, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <select
                      value={ing.inventoryId}
                      onChange={(e) => updateIngredient(index, 'inventoryId', e.target.value)}
                      className="flex-1 h-10 rounded-md border border-gray-300 px-3"
                    >
                      <option value="">Pilih Bahan</option>
                      {inventory.map(inv => (
                        <option key={inv.id} value={inv.id}>
                          {inv.nama} ({inv.unit})
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={ing.qty}
                      onChange={(e) => updateIngredient(index, 'qty', e.target.value)}
                      className="w-24"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeIngredient(index)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddDialogOpen(false);
              setEditDialogOpen(false);
              setSelectedItem(null);
              resetForm();
            }}>
              Batal
            </Button>
            <Button onClick={editDialogOpen ? handleUpdate : handleAdd}>
              {editDialogOpen ? 'Simpan' : 'Tambah'}
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
