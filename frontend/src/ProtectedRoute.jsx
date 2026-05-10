import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Desensamblador de JWT (Base64Url -> JSON)
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export default function ProtectedRoute({ allowedRoles }) {
  const { token } = useAuth();

  // si no hay token, que manda al login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // decifra el token para sacar el rol del usuario
  const decodedToken = parseJwt(token);
  const userRole = decodedToken?.rol; 

  // si el rol no existe o no está en la lista de roles permitidos, manda al login
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}