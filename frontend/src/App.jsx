import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from './components/MainLayout';
import { lazy, Suspense } from 'react';
import LoadingSpinner from './components/LoadingSpinner';

const Login = lazy(() => import('./pages/Login/Login'));
const Register = lazy(() => import('./pages/Register/Register'));
const Landing = lazy(() => import('./pages/Landing/Landing'));
const MentorDashboard = lazy(() => import('./pages/MentorDashboard/MentorDashboard'));
const CompleteProfile = lazy(() => import('./pages/CompleteProfile/CompleteProfile'));
const MenteeDashboard = lazy(() => import('./pages/MenteeDashboard/MenteeDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard/AdminDashboard'));
const MenteeCompleteProfile = lazy(() => import('./pages/MenteeCompleteProfile/MenteeCompleteProfile'));
const PaquetesPage = lazy(() => import('./pages/Paquetes/PaquetesPage'));
const Marketplace = lazy(() => import('./pages/Marketplace/Marketplace'));
const MisContratos = lazy(() => import('./pages/MisContratos/MisContratos'));
const AgendarSesion = lazy(() => import('./pages/AgendarSesion/AgendarSesionPage'));
const SalaVideoPage = lazy(() => import('./pages/SalaVideo/SalaVideoPage'));
const MentorAvailabilityPanel = lazy(() => import('./components/MentorAvailabilityPanel'));
const ChatPage = lazy(() => import('./pages/Chat/ChatPage'));
const PublicProfile = lazy(() => import('./pages/PublicProfile/PublicProfile'));

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<MainLayout />}>
              <Route path="/catalog" element={<Marketplace />} />

              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['mentor', 'admin']} />}>
                <Route path="/mentor" element={<MentorDashboard />} />
                <Route path="/mentor/completar-perfil" element={<CompleteProfile />} />
                <Route path="/mentor/paquetes" element={<PaquetesPage />} />
                <Route path="/mentor/horarios" element={<MentorAvailabilityPanel />} />
              </Route>

              <Route path="/mentor/perfil/:id" element={<PublicProfile />} />

              <Route element={<ProtectedRoute allowedRoles={['mentee', 'admin']} />}>
                <Route path="/mentee" element={<MenteeDashboard />} />
                <Route path="/mentee/completar-perfil" element={<MenteeCompleteProfile />} />
                <Route path="/mentee/agendar" element={<AgendarSesion />} />
                <Route path="/mentee/contratos" element={<MisContratos />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['mentor', 'mentee', 'admin']} />}>
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/sesion/:id_sesion" element={<SalaVideoPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
