import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
import PaquetesPage from './pages/Paquetes/PaquetesPage'; 
import Marketplace from './pages/Marketplace/Marketplace';
import MisContratos from './pages/MisContratos/MisContratos';
import AgendarSesion from './pages/AgendarSesion/AgendarSesion';
import MentorAvailabilityPanel from './components/MentorAvailabilityPanel';
import ChatPage from './pages/Chat/ChatPage';

export default function App() {
  // Estado para controlar el modo oscuro de Tailwind de forma creativa
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

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
              <Route path="/mentor/paquetes" element={<PaquetesPage />} />
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

            {/* Rutas de Chat */}
            <Route element={<ProtectedRoute allowedRoles={['mentor', 'mentee', 'admin']} />}>
              <Route path="/chat" element={<ChatPage />} />
            </Route>
            
          </Route>
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        {/* Interruptor Creativo Flotante Light/Dark */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-celeste text-white shadow-lg transition-transform duration-200 hover:scale-110 active:scale-95 dark:bg-plomo-700"
          aria-label="Toggle Dark Mode"
          title="Cambiar Modo de Color"
        >
          {darkMode ? (
            // Icono de Sol ☀️
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m2.828 5.657a4 4 0 118 0 4 4 0 01-8 0z" />
            </svg>
          ) : (
            // Icono de Luna 🌙
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-plomo-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </BrowserRouter>
    </AuthProvider>
  );
}