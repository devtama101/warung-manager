import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { NewOrder } from './pages/NewOrder';
import { Menu } from './pages/Menu';
import { Inventory } from './pages/Inventory';
import { SimpleInventory } from './pages/SimpleInventory';
import { StockStatus } from './pages/StockStatus';
import { ReportsSimple as Reports } from './pages/ReportsSimple';
import { Devices } from './pages/Devices';
import DebugSync from './pages/DebugSync';
import { AdminLayout } from './components/admin/layout/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminLogin } from './pages/admin/AdminLogin';
import { Users } from './pages/admin/Users';
import { UserDetailNew as UserDetail } from './pages/admin/UserDetailNew';
import { RevenueNew as Revenue } from './pages/admin/RevenueNew';
import { OrderMonitoring } from './pages/admin/OrderMonitoring';
import { AdminReports } from './pages/admin/AdminReports';
import { Settings } from './pages/admin/Settings';
import SyncManagement from './pages/admin/SyncManagement';
import { ResetData } from './pages/admin/ResetData';
import { DatabaseMonitor } from './components/debug/DatabaseMonitor';
import { WarungLogin } from './pages/WarungLogin';
import { WarungRegister } from './pages/WarungRegister';
import LandingPage from './pages/LandingPage';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { ProtectedWarungRoute } from './components/ProtectedWarungRoute';
import { AuthProvider } from './contexts/AuthContext';
import { WarungAuthProvider, setupAxiosInterceptors } from './contexts/WarungAuthContext';
import { initializeDevice, seedInitialData } from './db/schema';
import { syncManager } from './lib/sync';
import { Toaster } from 'sonner';
import './lib/indexedDBDebugger';

function App() {
  useEffect(() => {
    // Initialize app
    const initApp = async () => {
      try {
        // Initialize device ID
        await initializeDevice();

        // Seed initial data if needed
        await seedInitialData();

        // Setup axios interceptors
        setupAxiosInterceptors();

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
    <WarungAuthProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing Page Route (Public) */}
            <Route path="/" element={<LandingPage />} />

            {/* Warung Login/Register Routes (Public) */}
            <Route path="/warung/login" element={<WarungLogin />} />
            <Route path="/warung/register" element={<WarungRegister />} />

            {/* User Dashboard Routes (Protected by Warung Auth) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedWarungRoute>
                  <Layout />
                </ProtectedWarungRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/new" element={<NewOrder />} />
              <Route path="stock" element={<StockStatus />} />
              <Route path="inventory" element={<SimpleInventory />} />
              <Route path="reports" element={<Reports />} />
              <Route path="debug-sync" element={<DebugSync />} />
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
              <Route path="devices" element={<Devices />} />
              <Route path="menu" element={<Menu />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="revenue" element={<Revenue />} />
              <Route path="orders" element={<OrderMonitoring />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="sync" element={<SyncManagement />} />
              <Route path="reset" element={<ResetData />} />
              <Route path="debug" element={<DatabaseMonitor />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </WarungAuthProvider>
  );
}

export default App;
