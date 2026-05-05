import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext'; 
import PaquetesMentor from './components/Paquetes/PaquetesMentor';
import ProtectedRoute from './ProtectedRoute'; 
import Login from './pages/Login/Login';
import MentorDashboard from './pages/MentorDashboard/MentorDashboard';
import CompleteProfile from './pages/CompleteProfile/CompleteProfile';

// Componentes temporales (puedes moverlos a sus propios archivos luego)
const AdminDashboard = () => <h1 className="text-white text-center mt-10">Admin Dashboard</h1>;
const MenteeDashboard = () => <h1 className="text-white text-center mt-10">Mentee Dashboard</h1>;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />

          {/* Rutas de Administrador */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Rutas de Mentor */}
          <Route element={<ProtectedRoute allowedRoles={['mentor', 'admin']} />}>
            <Route path="/mentor" element={<MentorDashboard />} />
            <Route path="/mentor/completar-perfil" element={<CompleteProfile />} />
            {/* NUEVA RUTA INTEGRADA */}
            <Route path="/mentor/paquetes" element={<PaquetesMentor />} />
          </Route>

          {/* Rutas de Mentee (Alumno) */}
          <Route element={<ProtectedRoute allowedRoles={['mentee', 'admin']} />}>
            <Route path="/mentee" element={<MenteeDashboard />} />
          </Route>
          
          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}