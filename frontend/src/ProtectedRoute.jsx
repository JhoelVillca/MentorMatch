import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

const AuthLoader = () => (
  <div className="min-h-screen bg-[#080710] flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
  </div>
);


// para desifrar el rol, pero esta vez desde el token, no desde el localStorage, para evitar problemas de disque zincronizacion -_-
export default function ProtectedRoute({ allowedRoles }) {
  const { token, userRole, loading } = useAuth();

  if (loading) return <AuthLoader />;

  if (!token) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}