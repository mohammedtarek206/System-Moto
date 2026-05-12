import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex-center min-h-screen bg-[var(--bg-dark)]">
      <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full loading-spin" />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
