import { Link } from 'react-router-dom';
import { Menu, Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
            <span className="text-xl font-bold">Warung POS</span>
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
        </div>
      </div>
    </nav>
  );
}
