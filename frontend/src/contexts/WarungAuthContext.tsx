import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { getDeviceId } from '@/db/schema';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface WarungUser {
  id: number;
  email: string;
  name?: string;
  warungNama: string;
  warungAlamat?: string;
}

interface WarungAuthContextType {
  isAuthenticated: boolean;
  user: WarungUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  warungNama: string;
  warungAlamat?: string;
}

const WarungAuthContext = createContext<WarungAuthContextType | undefined>(undefined);

export function WarungAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<WarungUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = () => {
      const savedToken = localStorage.getItem('warungAuthToken');
      const savedUser = localStorage.getItem('warungUser');

      if (savedToken && savedUser) {
        try {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to restore session:', error);
          localStorage.removeItem('warungAuthToken');
          localStorage.removeItem('warungUser');
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const deviceId = getDeviceId();
      const deviceName = `Device-${deviceId.slice(0, 8)}`;

      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
        deviceId,
        deviceName
      });

      if (response.data.success) {
        const { user, token } = response.data.data;

        setUser(user);
        setToken(token);
        setIsAuthenticated(true);

        // Save to localStorage
        localStorage.setItem('warungAuthToken', token);
        localStorage.setItem('warungUser', JSON.stringify(user));

        // Update settings with userId and token
        const { db } = await import('@/db/schema');
        const settings = await db.settings.toArray();
        if (settings.length > 0) {
          await db.settings.update(settings[0].id!, {
            userId: user.id.toString(),
            authToken: token,
            warungNama: user.warungNama,
            warungAlamat: user.warungAlamat || undefined,
            updatedAt: new Date()
          });
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      console.log('Attempting registration with:', { email: data.email, warungNama: data.warungNama });
      console.log('API URL:', `${API_URL}/api/auth/register`);

      const response = await axios.post(`${API_URL}/api/auth/register`, data);

      console.log('Registration response:', response.data);

      if (response.data.success) {
        const { user, token } = response.data.data;

        setUser(user);
        setToken(token);
        setIsAuthenticated(true);

        // Save to localStorage
        localStorage.setItem('warungAuthToken', token);
        localStorage.setItem('warungUser', JSON.stringify(user));

        // Update settings
        const { db, getDeviceId } = await import('@/db/schema');
        const deviceId = getDeviceId();
        const settings = await db.settings.toArray();
        if (settings.length > 0) {
          await db.settings.update(settings[0].id!, {
            userId: user.id.toString(),
            authToken: token,
            warungNama: user.warungNama,
            warungAlamat: user.warungAlamat || undefined,
            updatedAt: new Date()
          });
        }

        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error response:', error?.response?.data);
      console.error('Error message:', error?.message);
      console.error('API URL attempted:', `${API_URL}/api/auth/register`);
      throw error; // Re-throw to let the component handle it
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    localStorage.removeItem('warungAuthToken');
    localStorage.removeItem('warungUser');
  };

  return (
    <WarungAuthContext.Provider value={{ isAuthenticated, user, token, login, register, logout, loading }}>
      {children}
    </WarungAuthContext.Provider>
  );
}

export function useWarungAuth() {
  const context = useContext(WarungAuthContext);
  if (context === undefined) {
    throw new Error('useWarungAuth must be used within a WarungAuthProvider');
  }
  return context;
}

// Axios interceptor to add token to all requests
export function setupAxiosInterceptors() {
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('warungAuthToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
}
