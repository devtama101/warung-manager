import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { NewOrder } from './pages/NewOrder';
import { Menu } from './pages/Menu';
import { Inventory } from './pages/Inventory';
import { Reports } from './pages/Reports';
import { AdminLayout } from './components/admin/layout/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminLogin } from './pages/admin/AdminLogin';
import { Users } from './pages/admin/Users';
import { UserDetail } from './pages/admin/UserDetail';
import { Revenue } from './pages/admin/Revenue';
import { Settings } from './pages/admin/Settings';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { initializeDevice, seedInitialData } from './db/schema';
import { syncManager } from './lib/sync';

function App() {
  useEffect(() => {
    // Initialize app
    const initApp = async () => {
      try {
        // Initialize device ID
        await initializeDevice();

        // Seed initial data if needed
        await seedInitialData();

        // Start auto-sync
        syncManager.startAutoSync();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initApp();

    // Cleanup on unmount
    return () => {
      syncManager.stopAutoSync();
    };
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* User Dashboard Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/new" element={<NewOrder />} />
            <Route path="menu" element={<Menu />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          {/* Admin Login Route (Public) */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Dashboard Routes (Protected) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="users/:id" element={<UserDetail />} />
            <Route path="revenue" element={<Revenue />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
