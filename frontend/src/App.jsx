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
import AgendarSesion from './pages/AgendarSesion/AgendarSesionPage';
import SalaVideoPage from './pages/SalaVideo/SalaVideoPage';
import MentorAvailabilityPanel from './components/MentorAvailabilityPanel';
import ChatPage from './pages/Chat/ChatPage';

export default function App() {
  // Estado para controlar el modo oscuro de Tailwind
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  // useEffect(() => {
  //   if (darkMode) {
  //     document.documentElement.classList.add('dark');
  //     localStorage.setItem('theme', 'dark');
  //   } else {
  //     document.documentElement.classList.remove('dark');
  //     localStorage.setItem('theme', 'light');
  //   }
  // }, [darkMode]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className={`min-h-screen font-['Poppins'] relative overflow-hidden transition-colors duration-500 ease-out ${
          darkMode ? "bg-[#060911] text-white" : "bg-slate-50 text-slate-900"
        }`}>
          
          {/* 🌌 FONDO ABSTRACTO ULTRA-MODERNO GLOBAL */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            {/* Malla de puntos sutil */}
            <div 
              className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
              style={{
                backgroundImage: `radial-gradient(${darkMode ? '#ffffff' : '#000000'} 1px, transparent 1px)`,
                backgroundSize: '32px 32px'
              }}
            />
            {/* Luces de neón difusas */}
            <div className={`absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-cyan-500/10 to-blue-600/0 blur-[130px] transition-opacity duration-700 ${darkMode ? "opacity-100" : "opacity-40"}`} />
            <div className={`absolute bottom-[-10%] left-[-5%] w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-indigo-600/10 to-purple-500/0 blur-[150px] transition-opacity duration-700 ${darkMode ? "opacity-100" : "opacity-30"}`} />
          </div>

          {/* Contenedor interactivo principal */}
          <div className="relative z-10 min-h-screen flex flex-col">
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
                  <Route path="/sesion/:id_sesion" element={<SalaVideoPage />} />
                </Route>
                
              </Route>
              
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>

          {/* ☀️/🌙 INTERRUPTOR GLASSMORPHISM MEJORADO */}
          {/* <button
            onClick={() => setDarkMode(!darkMode)}
            className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95 group border ${
              darkMode 
                ? "bg-slate-900/70 border-white/10 text-amber-400 shadow-black/40 hover:border-amber-400/30 hover:shadow-amber-500/5" 
                : "bg-white/80 border-slate-200/80 text-indigo-600 shadow-slate-300/50 hover:border-indigo-500/30 hover:shadow-indigo-500/10"
            }`}
            aria-label="Toggle Dark Mode"
            title="Cambiar Modo de Color"
          >
            {darkMode ? (
              // Icono Solar con rotación sutil en Hover
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transition-transform duration-500 group-hover:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m2.828 5.657a4 4 0 118 0 4 4 0 01-8 0z" />
              </svg>
            ) : (
              // Icono Lunar con balanceo en Hover
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transition-transform duration-500 group-hover:-rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button> */}
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}