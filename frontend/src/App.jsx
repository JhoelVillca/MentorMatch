import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext'; 
import ProtectedRoute from './ProtectedRoute'; 
import MainLayout from './components/MainLayout'; 

import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import MentorDashboard from './pages/MentorDashboard/MentorDashboard';
import CompleteProfile from './pages/CompleteProfile/CompleteProfile';
import MenteeDashboard from './pages/MenteeDashboard/MenteeDashboard';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import MenteeCompleteProfile from './pages/MenteeCompleteProfile/MenteeCompleteProfile';
import PackagesPage from './pages/PackagesPage/PackagesPage'; 
import Marketplace from './pages/Marketplace/Marketplace';
import MisContratos from './pages/MisContratos/MisContratos';
import AgendarSesion from './pages/AgendarSesion/AgendarSesion';
import MentorAvailabilityPanel from './components/MentorAvailabilityPanel';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas sin Navbar (Aisladas) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas con Navbar (Envueltas en MainLayout) */}
          <Route element={<MainLayout />}>
            
            {/* Rutas de Administrador */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* Rutas de Mentor */}
            <Route element={<ProtectedRoute allowedRoles={['mentor', 'admin']} />}>
              <Route path="/mentor" element={<MentorDashboard />} />
              <Route path="/mentor/completar-perfil" element={<CompleteProfile />} />
              <Route path="/mentor/paquetes" element={<PackagesPage />} />
              <Route path="/mentor/horarios" element={<MentorAvailabilityPanel />} />
            </Route>

            {/* Rutas de Mentee */}
            <Route element={<ProtectedRoute allowedRoles={['mentee', 'admin']} />}>
              <Route path="/mentee" element={<MenteeDashboard />} />
              <Route path="/mentee/completar-perfil" element={<MenteeCompleteProfile />} />
              <Route path="/mentee/marketplace" element={<Marketplace />} />
              <Route path="/mentee/agendar" element={<AgendarSesion />} />
              <Route path="/mentee/contratos" element={<MisContratos />} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}