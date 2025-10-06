import { Link, useNavigate } from 'react-router-dom';
import { Menu, Wifi, WifiOff, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useWarungAuth } from '@/contexts/WarungAuthContext';

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useWarungAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg sticky top-0 z-40">
      <div className="flex items-center justify-between h-16 px-6 lg:px-8">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md hover:bg-blue-700 lg:hidden"
          >
            <Menu size={24} />
          </button>
          <Link to="/" className="flex items-center space-x-2 ml-2 lg:ml-0">
            <span className="text-xl font-bold">Warung Manager</span>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <>
                <Wifi size={20} />
                <span className="text-sm hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff size={20} />
                <span className="text-sm hidden sm:inline">Offline</span>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-blue-700"
            >
              <User size={20} />
              <span className="text-sm hidden md:inline">{user?.businessName}</span>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user?.businessName}</p>
                    <p className="text-xs text-gray-600">{user?.name}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
