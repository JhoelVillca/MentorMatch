import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

const AuthLoader = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="w-9 h-9 rounded-full border-2 border-slate-200 border-t-primary-600 animate-spin" />
  </div>
);

export default function ProtectedRoute({ allowedRoles }) {
  const { token, userRole, loading } = useAuth();

  if (loading) return <AuthLoader />;
  if (!token) return <Navigate to="/login" replace />;

  return <Outlet />;
}
