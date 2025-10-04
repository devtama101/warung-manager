import { Navigate } from 'react-router-dom';
import { useWarungAuth } from '@/contexts/WarungAuthContext';

interface ProtectedWarungRouteProps {
  children: React.ReactNode;
}

export function ProtectedWarungRoute({ children }: ProtectedWarungRouteProps) {
  const { isAuthenticated, loading } = useWarungAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
