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

    setLoading(true);

    try {
      await registerAPI(email, password, rol.toLowerCase());
      navigate('/login');
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Fondo adaptativo Celeste Plomo alineado con Login
    <div className="min-h-screen bg-background dark:bg-plomo-darkCanvas font-['Poppins'] flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300 relative overflow-hidden">
      
      {/* Efectos de Luces de Fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-celeste/20 dark:bg-celeste/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-plomo-700/20 dark:bg-plomo-800/30 blur-[80px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-plomo-900 dark:text-white tracking-tight">
          Crea tu cuenta en MentorMatch
        </h2>
        <p className="mt-2 text-center text-sm text-plomo-700 dark:text-plomo-100/70">
          O{' '}
          <Link to="/login" className="font-semibold text-celeste hover:text-celeste-dark transition-colors">
            inicia sesión si ya tienes cuenta
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-surface dark:bg-plomo-darkSurface py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-plomo-100 dark:border-plomo-700/50 backdrop-blur-sm transition-all duration-300">
          
          {errorMsg && (
            <div className="mb-6 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-4 rounded-md">
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

          <form className="space-y-6" onSubmit={handleRegister}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-plomo-700 dark:text-plomo-100">
                Correo electrónico
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 border border-plomo-100 dark:border-plomo-700 bg-background dark:bg-plomo-darkCanvas text-plomo-900 dark:text-white rounded-lg shadow-sm placeholder-plomo-700/40 dark:placeholder-plomo-100/30 focus:outline-none focus:ring-2 focus:ring-celeste focus:border-transparent sm:text-sm transition-all duration-200"
                  placeholder="ejemplo@correo.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-plomo-700 dark:text-plomo-100">
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 border border-plomo-100 dark:border-plomo-700 bg-background dark:bg-plomo-darkCanvas text-plomo-900 dark:text-white rounded-lg shadow-sm placeholder-plomo-700/40 dark:placeholder-plomo-100/30 focus:outline-none focus:ring-2 focus:ring-celeste focus:border-transparent sm:text-sm transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label htmlFor="rol" className="block text-sm font-medium text-plomo-700 dark:text-plomo-100">
                ¿Qué buscas en MentorMatch?
              </label>
              <div className="mt-1">
                <select
                  id="rol"
                  name="rol"
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2.5 text-base border border-plomo-100 dark:border-plomo-700 bg-background dark:bg-plomo-darkCanvas text-plomo-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-celeste focus:border-transparent sm:text-sm rounded-lg shadow-sm transition-all duration-200"
                >
                  <option value="Mentee" className="bg-surface dark:bg-plomo-darkSurface text-plomo-900 dark:text-white">Quiero aprender (Mentee)</option>
                  <option value="Mentor" className="bg-surface dark:bg-plomo-darkSurface text-plomo-900 dark:text-white">Quiero enseñar (Mentor)</option>
                </select>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white transition-all duration-200 ${
                  loading 
                    ? 'bg-celeste/60 cursor-not-allowed' 
                    : 'bg-celeste hover:bg-celeste-dark active:scale-[0.98]'
                }`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </span>
                ) : (
                  'Crear Cuenta'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}