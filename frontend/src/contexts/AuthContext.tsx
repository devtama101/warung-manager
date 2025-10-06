import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { getDeviceId } from '@/db/schema';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { email: string; name: string; businessName?: string; id?: number } | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ email: string; name: string; businessName?: string; id?: number } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = () => {
      const savedToken = localStorage.getItem('adminAuthToken');
      const savedUser = localStorage.getItem('adminUser');

      if (savedToken && savedUser) {
        try {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to restore session:', error);
          localStorage.removeItem('adminAuthToken');
          localStorage.removeItem('adminUser');
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const deviceId = getDeviceId();
      const deviceName = `Admin-${deviceId.slice(0, 8)}`;

      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
        deviceId,
        deviceName
      });

      if (response.data.success && response.data.data.role === 'admin') {
        const { user, token } = response.data.data;

        const userData = {
          email: user.email,
          name: user.businessName || 'Admin',
          businessName: user.businessName,
          id: user.id
        };

        setUser(userData);
        setToken(token);
        setIsAuthenticated(true);

        // Save to localStorage
        localStorage.setItem('adminAuthToken', token);
        localStorage.setItem('adminUser', JSON.stringify(userData));

        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    localStorage.removeItem('adminAuthToken');
    localStorage.removeItem('adminUser');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
