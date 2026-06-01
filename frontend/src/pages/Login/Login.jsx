import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext'; 
import { loginAPI } from '../../services/authService'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estado para el tema
  const [isDarkMode, setIsDarkMode] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Efecto para gestionar el modo oscuro
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // MANTENIENDO TU FUNCIONALIDAD ORIGINAL EXACTA
      await loginAPI(email, password);
      const userData = await login();

      if (userData) {
        if (userData.rol === 'admin') navigate('/admin');
        else if (userData.rol === 'mentor') navigate('/mentor');
        else navigate('/mentee');
      } else {
        setError('Error fatal al recuperar sesión.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sideImageUrl = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1470&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-plomo-darkCanvas font-['Poppins'] flex transition-colors duration-500">
      
      {/* Botón de cambio de tema añadido manteniendo todo lo demás igual */}
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="absolute top-4 right-4 z-[100] p-2 rounded-lg bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700"
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>

      {/* 1. LADO IZQUIERDO: Formulario (Funcionalidad intacta) */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 z-10 bg-slate-50 dark:bg-plomo-darkCanvas relative">
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
              ¡Qué bueno verte de nuevo!
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Ingresa tus credenciales para acceder a tus mentorías personalizadas.
            </p>
          </div>

          <div className="mt-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <input 
                    type="email" 
                    placeholder="nombre@correo.com" 
                    id="username"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="block w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-plomo-darkSurface text-slate-900 dark:text-white rounded-xl placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-celeste focus:border-transparent sm:text-sm font-medium transition-all duration-200 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Contraseña
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    id="password"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    className="block w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-plomo-darkSurface text-slate-900 dark:text-white rounded-xl placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-celeste focus:border-transparent sm:text-sm font-medium transition-all duration-200 shadow-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className={`w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-lg shadow-celeste/10 text-sm font-bold text-white transition-all duration-300 transform font-['Poppins'] ${
                    loading 
                      ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed shadow-none' 
                      : 'bg-gradient-to-r from-celeste to-celeste-dark hover:opacity-95 hover:translate-y-[-1px] active:translate-y-[1px]'
                  }`}
                >
                  {loading ? 'Validando credenciales...' : 'Iniciar Sesión'}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                ¿Nuevo en la plataforma?{' '}
                <Link to="/register" className="font-semibold text-celeste hover:text-celeste-dark underline underline-offset-4 transition-all duration-200">
                  Crea una cuenta aquí
                </Link>
              </p>
            </div>
            
            {error && (
              <div className="mt-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-3.5 rounded-xl text-red-700 dark:text-red-400 text-center text-xs font-semibold flex items-center justify-center gap-2">
                <span>{typeof error === 'object' ? JSON.stringify(error) : error}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. LADO DERECHO: Banner Visual (Sección intacta) */}
      <div className="hidden lg:block relative flex-1 w-0">
        <img className="absolute inset-0 h-full w-full object-cover" src={sideImageUrl} alt="Mentoría" />
        <div className="absolute inset-0 bg-gradient-to-t from-plomo-900 via-plomo-900/40 to-celeste/20 mix-blend-multiply" />
      </div>
    </div>
  );
}