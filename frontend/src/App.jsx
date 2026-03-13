import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import MentorDashboard from './pages/MentorDashboard';
import MenteeDashboard from './pages/MenteeDashboard';
import ProtectedRoute from './ProtectedRoute'; 
import { useAuth } from './AuthContext'; // <--- Importamos el cerebro

// EL POLICÍA DE TRÁFICO
function TrafficCop() {
  const { user, loading } = useAuth();
  
  if (loading) return <div style={{color: 'white', padding: '20px'}}>Leyendo tu ADN digital...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  // Dependiendo del rol, te mandamos a tu verdadera casa
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'mentor') return <Navigate to="/mentor" replace />;
  return <Navigate to="/mentee" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* La ruta a la que apunta el Login */}
        <Route path="/dashboard" element={<TrafficCop />} />
        
        {/* Rutas Blindadas */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/mentor" 
          element={
            <ProtectedRoute allowedRoles={['mentor']}>
              <MentorDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/mentee" 
          element={
            <ProtectedRoute allowedRoles={['mentee', 'admin']}>
              <MenteeDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;