import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerAPI } from '../../services/authService';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('Mentee');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      setErrorMsg('La contraseña debe tener al menos 8 caracteres, 1 mayúscula y 1 número.');
      return;
    }

    loading(true);

    try {
      await registerAPI(email, password, rol.toLowerCase());
      navigate('/login');
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Imagen conceptual de crecimiento, educación y mentoría para el Split-Screen
  const sideImageUrl = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1471&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-background dark:bg-plomo-darkCanvas font-['Poppins'] flex transition-colors duration-500">
      
      {/* 1. LADO IZQUIERDO: Formulario de Registro Estilizado */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 z-10 bg-background dark:bg-plomo-darkCanvas relative">
        
        {/* Efecto de luz difuminada sutil en el fondo del formulario */}
        <div className="absolute top-0 left-0 w-[250px] h-[250px] rounded-full bg-celeste/10 blur-[80px] pointer-events-none" />
        
        <div className="mx-auto w-full max-w-sm lg:w-96 z-10">
          {/* Encabezado e Isotipo unificado */}
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

          {/* Formulario */}
          <div className="mt-8">
            
            {errorMsg && (
              <div className="mb-5 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-4 rounded-xl transition-all duration-300">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                      {errorMsg}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleRegister}>
              {/* Input: Correo electrónico */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Correo electrónico
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 border border-plomo-100 dark:border-plomo-700 bg-background dark:bg-plomo-darkCanvas text-plomo-900 dark:text-white rounded-xl placeholder-plomo-700/40 dark:placeholder-plomo-100/30 focus:outline-none focus:ring-2 focus:ring-celeste focus:border-transparent sm:text-sm font-medium transition-all duration-200 shadow-sm"
                    placeholder="ejemplo@correo.com"
                  />
                </div>
              </div>

              {/* Input: Contraseña */}
              <div>
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Contraseña
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 border border-plomo-100 dark:border-plomo-700 bg-background dark:bg-plomo-darkCanvas text-plomo-900 dark:text-white rounded-xl placeholder-plomo-700/40 dark:placeholder-plomo-100/30 focus:outline-none focus:ring-2 focus:ring-celeste focus:border-transparent sm:text-sm font-medium transition-all duration-200 shadow-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Select: Rol en la plataforma */}
              <div>
                <label htmlFor="rol" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  ¿Qué buscas en MentorMatch?
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <select
                    id="rol"
                    name="rol"
                    value={rol}
                    onChange={(e) => setRol(e.target.value)}
                    className="block w-full pl-11 pr-10 py-3 border border-plomo-100 dark:border-plomo-700 bg-background dark:bg-plomo-darkCanvas text-plomo-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-celeste focus:border-transparent sm:text-sm font-medium transition-all duration-200 shadow-sm appearance-none"
                  >
                    <option value="Mentee" className="bg-surface dark:bg-plomo-darkSurface text-plomo-900 dark:text-white">Quiero aprender (Mentee)</option>
                    <option value="Mentor" className="bg-surface dark:bg-plomo-darkSurface text-plomo-900 dark:text-white">Quiero enseñar (Mentor)</option>
                  </select>
                  {/* Flecha estética integrada para romper el estilo plano del navegador */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Botón de Registro */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-celeste/10 text-sm font-bold text-white transition-all duration-300 transform font-['Poppins'] ${
                    loading 
                      ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed shadow-none' 
                      : 'bg-celeste hover:bg-celeste-dark hover:opacity-95 hover:translate-y-[-1px] active:translate-y-[1px]'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Procesando...</span>
                    </div>
                  ) : (
                    'Crear Cuenta'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* 2. LADO DERECHO: Banner Visual de Aprendizaje Colaborativo */}
      <div className="hidden lg:block relative flex-1 w-0">
        <img 
          className="absolute inset-0 h-full w-full object-cover" 
          src={sideImageUrl} 
          alt="Comunidad MentorMatch" 
        />
        {/* Capa de degradado oscuro y celeste para armonizar la foto */}
        <div className="absolute inset-0 bg-gradient-to-t from-plomo-900 via-plomo-900/40 to-celeste/20 mix-blend-multiply" />
        
        {/* Texto conceptual */}
        <div className="absolute bottom-16 left-16 right-16 z-20 text-white">
          <span className="bg-celeste/90 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block backdrop-blur-sm">
            Comunidad Global
          </span>
          <h1 className="text-4xl font-black tracking-tight leading-none mb-4">
            Llegó el momento de <br /> expandir tus horizontes.
          </h1>
          <p className="text-lg text-slate-200 font-medium max-w-md">
            Monetiza tus conocimientos como Mentor o acelera tu aprendizaje como Mentee con enseñanza personalizada de confianza.
          </p>
        </div>
      </div>

    </div>
  );
}