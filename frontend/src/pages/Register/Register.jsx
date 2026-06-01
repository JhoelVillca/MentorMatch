import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerAPI } from '../../services/authService';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('Mentee');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Estado para el modo oscuro
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const navigate = useNavigate();

  // Efecto para sincronizar el modo oscuro con el DOM
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      setErrorMsg('La contraseña debe tener al menos 8 caracteres, 1 mayúscula y 1 número.');
      return;
    }

    setLoading(true); // Corregido de loading(true) a setLoading(true)

    try {
      await registerAPI(email, password, rol.toLowerCase());
      navigate('/login');
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  const sideImageUrl = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1471&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-background dark:bg-plomo-darkCanvas font-['Poppins'] flex transition-colors duration-500">
      
      {/* Botón de cambio de tema */}
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="absolute top-6 right-6 z-[100] p-2.5 rounded-xl bg-white dark:bg-plomo-darkSurface shadow-md border border-slate-200 dark:border-slate-700 transition-all hover:scale-105"
        aria-label="Cambiar tema"
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>

      {/* 1. LADO IZQUIERDO: Formulario de Registro */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 z-10 bg-background dark:bg-plomo-darkCanvas relative">
        <div className="absolute top-0 left-0 w-[250px] h-[250px] rounded-full bg-celeste/10 blur-[80px] pointer-events-none" />
        
        <div className="mx-auto w-full max-w-sm lg:w-96 z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-celeste to-celeste-dark flex items-center justify-center shadow-md shadow-celeste/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-plomo-900 dark:text-white">
                Mentor<span className="text-celeste">Match</span>
              </h2>
            </div>
            
            <h3 className="mt-8 text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Crea tu cuenta en MentorMatch
            </h3>
            <p className="mt-2 text-sm text-plomo-700 dark:text-plomo-100/70">
              O{' '}
              <Link to="/login" className="font-semibold text-celeste hover:text-celeste-dark underline underline-offset-4 transition-colors">
                inicia sesión si ya tienes cuenta
              </Link>
            </p>
          </div>

          <div className="mt-8">
            {errorMsg && (
              <div className="mb-5 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-4 rounded-xl">
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">{errorMsg}</p>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleRegister}>
              {/* Campos de email, password y rol permanecen intactos */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Correo electrónico</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full px-4 py-3 border border-plomo-100 dark:border-plomo-700 bg-background dark:bg-plomo-darkCanvas text-plomo-900 dark:text-white rounded-xl focus:ring-2 focus:ring-celeste focus:border-transparent transition-all shadow-sm" placeholder="ejemplo@correo.com" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Contraseña</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full px-4 py-3 border border-plomo-100 dark:border-plomo-700 bg-background dark:bg-plomo-darkCanvas text-plomo-900 dark:text-white rounded-xl focus:ring-2 focus:ring-celeste focus:border-transparent transition-all shadow-sm" placeholder="••••••••" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">¿Qué buscas en MentorMatch?</label>
                <select value={rol} onChange={(e) => setRol(e.target.value)} className="block w-full px-4 py-3 border border-plomo-100 dark:border-plomo-700 bg-background dark:bg-plomo-darkCanvas text-plomo-900 dark:text-white rounded-xl focus:ring-2 focus:ring-celeste focus:border-transparent transition-all shadow-sm">
                  <option value="Mentee">Quiero aprender (Mentee)</option>
                  <option value="Mentor">Quiero enseñar (Mentor)</option>
                </select>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 px-4 rounded-xl bg-celeste text-white font-bold hover:opacity-90 transition-all">
                {loading ? 'Procesando...' : 'Crear Cuenta'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 2. LADO DERECHO: Banner (Sin cambios) */}
      <div className="hidden lg:block relative flex-1 w-0">
        <img className="absolute inset-0 h-full w-full object-cover" src={sideImageUrl} alt="Comunidad MentorMatch" />
        <div className="absolute inset-0 bg-gradient-to-t from-plomo-900 via-plomo-900/40 to-celeste/20 mix-blend-multiply" />
      </div>
    </div>
  );
}