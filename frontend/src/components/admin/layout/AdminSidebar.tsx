import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Smartphone, TrendingUp, Settings, X, ChefHat, Package, RefreshCw, Trash2, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: TrendingUp, label: 'Pendapatan', path: '/admin/revenue' },
  { icon: ClipboardList, label: 'Monitoring Pesanan', path: '/admin/orders' },
  { icon: ChefHat, label: 'Menu', path: '/admin/menu' },
  { icon: Package, label: 'Bahan Baku', path: '/admin/inventory' },
  { icon: Smartphone, label: 'Perangkat', path: '/admin/devices' },
  { icon: RefreshCw, label: 'Sinkronisasi', path: '/admin/sync' },
  { icon: Settings, label: 'Pengaturan', path: '/admin/settings' },
  { icon: Trash2, label: 'Reset Data', path: '/admin/reset' },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

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
          'fixed top-0 left-0 z-50 h-screen w-64 bg-gray-900 text-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-800 lg:hidden">
            <h2 className="text-lg font-semibold">Admin Menu</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-md">
              <X size={20} />
            </button>
          </div>

          {/* Logo/brand for desktop */}
          <div className="hidden lg:block p-6 border-b border-gray-800">
            <h1 className="text-xl font-bold text-blue-400">{user?.warungNama || 'Warung POS'}</h1>
            <p className="text-sm text-gray-400 mt-1">Admin • {user?.email || ''}</p>
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
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-gray-300 hover:bg-gray-800'
                  )}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-800">
            <Link
              to="/"
              className="flex items-center justify-center px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← Kembali ke Dashboard Kasir
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
