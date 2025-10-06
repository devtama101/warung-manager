import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Package, BarChart3, X, ClipboardList, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWarungAuth } from '@/contexts/WarungAuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: Home, label: 'Beranda', path: '/' },
  { icon: ShoppingCart, label: 'Order', path: '/orders' },
  { icon: ClipboardList, label: 'Status Stok', path: '/stock' },
  { icon: Package, label: 'Bahan Baku', path: '/inventory' },
  { icon: BarChart3, label: 'Laporan', path: '/reports' },
  { icon: RefreshCw, label: 'Sinkronisasi', path: '/debug-sync' },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useWarungAuth();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b lg:hidden">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">
              <X size={20} />
            </button>
          </div>

          {/* Hidden logo/brand for desktop */}
          <div className="hidden lg:block p-6 border-b">
            <h1 className="text-xl font-bold text-blue-600">{user?.businessName || 'Warung Manager'}</h1>
            <p className="text-sm text-gray-600 mt-1">{user?.name || ''} • {user?.email || ''}</p>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose()}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-blue-100 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
