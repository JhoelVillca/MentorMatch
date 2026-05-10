import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext'; 
import ProtectedRoute from './ProtectedRoute'; 
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import MentorDashboard from './pages/MentorDashboard/MentorDashboard';
import CompleteProfile from './pages/CompleteProfile/CompleteProfile';
import MenteeDashboard from './pages/MenteeDashboard/MenteeDashboard';
import MenteeCompleteProfile from './pages/MenteeCompleteProfile/MenteeCompleteProfile';

// SE REEMPLAZA EL COMPONENTE POR LA PÁGINA SEGÚN EL FEEDBACK
import PaquetesPage from './pages/Paquetes/PaquetesPage';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas de Administrador */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Rutas de Mentor */}
          <Route element={<ProtectedRoute allowedRoles={['mentor', 'admin']} />}>
            <Route path="/mentor" element={<MentorDashboard />} />
            <Route path="/mentor/completar-perfil" element={<CompleteProfile />} />
            
            {/* RUTA ACTUALIZADA PARA USAR LA PÁGINA OFICIAL */}
            <Route path="/mentor/paquetes" element={<PaquetesPage />} />
          </Route>

          {/* Rutas de Mentee (Alumno) */}
          <Route element={<ProtectedRoute allowedRoles={['mentee', 'admin']} />}>
            <Route path="/mentee" element={<MenteeDashboard />} />
            <Route path="/mentee/completar-perfil" element={<MenteeCompleteProfile />} />
          </Route>
          
          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}