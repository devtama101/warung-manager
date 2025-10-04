import { useEffect, useState } from 'react';
import { AlertCircle, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MenuCard } from '@/components/ui/menu-card';
import { db, Menu } from '@/db/schema';
import { Badge } from '@/components/ui/badge';

export function StockStatus() {
  const [menuItems, setMenuItems] = useState<Menu[]>([]);
  const [filteredItems, setFilteredItems] = useState<Menu[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMenuItems();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredItems(menuItems);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredItems(
        menuItems.filter(item =>
          item.nama.toLowerCase().includes(query) ||
          item.kategori.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, menuItems]);

  const loadMenuItems = async () => {
    setLoading(true);
    try {
      const items = await db.menu.orderBy('kategori').toArray();
      setMenuItems(items);
      setFilteredItems(items);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (id: number, currentStatus: boolean) => {
    try {
      await db.menu.update(id, { tersedia: !currentStatus });
      await loadMenuItems();
    } catch (error) {
      console.error('Failed to update menu availability:', error);
      alert('Gagal mengubah status menu');
    }
  };

  const groupByCategory = (items: Menu[]) => {
    const grouped = new Map<string, Menu[]>();
    items.forEach(item => {
      const category = item.kategori || 'Lainnya';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)?.push(item);
    });
    return grouped;
  };

  const groupedItems = groupByCategory(filteredItems);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Status Stok Menu</h1>
          <p className="text-gray-600 mt-1">Ubah ketersediaan menu (Tersedia/Habis)</p>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Cari menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Informasi</h3>
              <p className="text-sm text-blue-800 mt-1">
                Halaman ini hanya untuk mengubah status ketersediaan menu.
                Untuk mengubah harga, nama, atau menambah menu baru, silakan hubungi pemilik/admin warung.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Memuat data menu...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Tidak ada menu yang ditemukan</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {Array.from(groupedItems.entries()).map(([category, items]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {category}
                </h2>
                <span className="ml-3 text-sm text-gray-600">
                  ({items.length} item)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <MenuCard
                    key={item.id}
                    id={item.id}
                    nama={item.nama}
                    kategori={item.kategori}
                    harga={item.harga}
                    hargaModal={item.hargaModal}
                    deskripsi={item.deskripsi}
                    gambar={item.gambar}
                    tersedia={item.tersedia}
                    ingredients={item.ingredients}
                    onToggleAvailability={() => toggleAvailability(item.id!, item.tersedia)}
                  />
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
