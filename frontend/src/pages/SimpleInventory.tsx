import { useEffect, useState } from 'react';
import { Package, AlertCircle, Plus, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { db, InventoryItem } from '@/db/schema';

export function SimpleInventory() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustments, setAdjustments] = useState<Record<number, string>>({});

  useEffect(() => {
    loadInventoryItem();
  }, []);

  const loadInventoryItem = async () => {
    setLoading(true);
    try {
      const items = await db.inventoryItems.orderBy('name').toArray();
      setInventoryItems(items);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustmentChange = (id: number, value: string) => {
    setAdjustments({ ...adjustments, [id]: value });
  };

  const addStock = async (item: InventoryItem) => {
    const adjustment = parseFloat(adjustments[item.id!] || '0');
    if (adjustment <= 0 || isNaN(adjustment)) {
      alert('Masukkan jumlah yang valid untuk menambah stok');
      return;
    }

    try {
      await db.inventoryItems.update(item.id!, {
        stock: item.stock + adjustment,
        updatedAt: new Date()
      });
      setAdjustments({ ...adjustments, [item.id!]: '' });
      await loadInventoryItem();
    } catch (error) {
      console.error('Failed to add stock:', error);
      alert('Gagal menambah stok');
    }
  };

  const subtractStock = async (item: InventoryItem) => {
    const adjustment = parseFloat(adjustments[item.id!] || '0');
    if (adjustment <= 0 || isNaN(adjustment)) {
      alert('Masukkan jumlah yang valid untuk mengurangi stok');
      return;
    }

    if (item.stock - adjustment < 0) {
      alert('Stok tidak boleh negatif');
      return;
    }

    try {
      await db.inventoryItems.update(item.id!, {
        stock: item.stock - adjustment,
        updatedAt: new Date()
      });
      setAdjustments({ ...adjustments, [item.id!]: '' });
      await loadInventoryItem();
    } catch (error) {
      console.error('Failed to subtract stock:', error);
      alert('Gagal mengurangi stok');
    }
  };

  const getLowStockItems = () => {
    return inventoryItems.filter(item => item.stock <= item.minimumStock);
  };

  const groupByCategory = (items: InventoryItem[]) => {
    const grouped = new Map<string, InventoryItem[]>();
    items.forEach(item => {
      const category = item.category;
      const categoryLabel =
        category === 'raw_material' ? 'Bahan Baku' :
        category === 'packaging' ? 'Kemasan' : 'Lainnya';

      if (!grouped.has(categoryLabel)) {
        grouped.set(categoryLabel, []);
      }
      grouped.get(categoryLabel)?.push(item);
    });
    return grouped;
  };

  const lowStockItems = getLowStockItems();
  const groupedItems = groupByCategory(inventoryItems);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">InventoryItem Bahan Baku</h1>
          <p className="text-gray-600 mt-1">Kelola stok bahan baku (tambah/kurang)</p>
        </div>
        <Button onClick={loadInventoryItem}>
          Muat Ulang
        </Button>
      </div>

      {/* Info Alert */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Informasi</h3>
              <p className="text-sm text-blue-800 mt-1">
                Halaman ini hanya untuk menambah atau mengurangi stok bahan baku.
                Untuk menambah bahan baru, mengubah harga, atau menghapus bahan, silakan hubungi pemilik/admin warung.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Stok Menipis ({lowStockItems.length} item)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <span className="font-medium text-yellow-900">{item.name}</span>
                  <span className="text-sm text-yellow-700">
                    Sisa: {item.stock} {item.unit} (Min: {item.minimumStock} {item.unit})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Memuat data inventory...</p>
        </div>
      ) : inventoryItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">Belum ada bahan baku yang terdaftar</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {Array.from(groupedItems.entries()).map(([category, items]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center">
                <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
                <span className="ml-3 text-sm text-gray-600">({items.length} item)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => {
                  const isLowStock = item.stock <= item.minimumStock;

                  return (
                    <Card
                      key={item.id}
                      className={`group/card hover:shadow-lg transition-all duration-200 relative overflow-hidden ${
                        isLowStock ? 'border-yellow-300' : ''
                      }`}
                    >
                      {/* Hover gradient effect */}
                      <div className={`opacity-0 group-hover/card:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-br ${
                        isLowStock ? 'from-yellow-50' : 'from-blue-50'
                      } to-transparent pointer-events-none z-0`} />

                      {/* Accent bar */}
                      <div className={`absolute left-0 top-0 h-1 w-0 group-hover/card:w-full ${
                        isLowStock ? 'bg-yellow-500' : 'bg-blue-500'
                      } transition-all duration-300`} />

                      <CardContent className="p-6 relative z-10">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold group-hover/card:text-blue-600 transition-colors duration-200">
                              {item.name}
                            </h3>
                            {isLowStock && (
                              <Badge className="bg-yellow-500 text-white mt-2">
                                Stok Menipis
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Stok Info */}
                        <div className="mb-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Stok:</span>
                            <span className="font-bold text-lg text-blue-600">
                              {item.stock} {item.unit}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Min:</span>
                            <span className="text-sm font-medium">
                              {item.minimumStock} {item.unit}
                            </span>
                          </div>
                          {item.supplier && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Supplier:</span>
                              <span className="text-sm font-medium truncate ml-2">{item.supplier}</span>
                            </div>
                          )}
                        </div>

                        {/* Input & Actions */}
                        <div className="space-y-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            placeholder={`Jumlah (${item.unit})`}
                            value={adjustments[item.id!] || ''}
                            onChange={(e) => handleAdjustmentChange(item.id!, e.target.value)}
                            className="w-full"
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addStock(item)}
                              className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
                            >
                              <Plus size={16} className="mr-1" />
                              Tambah
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => subtractStock(item)}
                              className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                            >
                              <Minus size={16} className="mr-1" />
                              Kurangi
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
