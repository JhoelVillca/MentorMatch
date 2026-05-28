import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext'; 
import { loginAPI } from '../../services/authService'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
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

  // Imagen conceptual de Mentoría/Enseñanza personalizada de alta calidad
  const sideImageUrl = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1470&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-plomo-darkCanvas font-['Poppins'] flex transition-colors duration-500">
      
      {/* 1. LADO IZQUIERDO: Formulario de Acceso Limpio y Profesional */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 z-10 bg-slate-50 dark:bg-plomo-darkCanvas relative">
        
        {/* Adornos de luces difuminadas sutiles en el fondo del formulario */}
        <div className="absolute top-0 left-0 w-[250px] h-[250px] rounded-full bg-celeste/10 blur-[80px] pointer-events-none" />
        
        <div className="mx-auto w-full max-w-sm lg:w-96 z-10">
          {/* Encabezado e Isotipo */}
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

          {/* Formulario */}
          <div className="mt-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
              
              {/* Input: Correo Electrónico */}
              <div>
                <label htmlFor="username" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                    </svg>
                  </div>
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

              {/* Botón de Enviar */}
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
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Validando credenciales...</span>
                    </div>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </button>
              </div>
            </form>

            {/* Enlace para Registro */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                ¿Nuevo en la plataforma?{' '}
                <Link to="/register" className="font-semibold text-celeste hover:text-celeste-dark underline underline-offset-4 transition-all duration-200">
                  Crea una cuenta aquí
                </Link>
              </p>
            </div>
            
            {/* Alerta de Error integrada */}
            {error && (
              <div className="mt-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-3.5 rounded-xl text-red-700 dark:text-red-400 text-center text-xs font-semibold flex items-center justify-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{typeof error === 'object' ? JSON.stringify(error) : error}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. LADO DERECHO: Banner Visual e Inspiracional (Oculto en pantallas chicas) */}
      <div className="hidden lg:block relative flex-1 w-0">
        <img 
          className="absolute inset-0 h-full w-full object-cover" 
          src={sideImageUrl} 
          alt="Mentoría personalizada" 
        />
        {/* Capa de degradado corporativa sobre la foto para darle el look premium */}
        <div className="absolute inset-0 bg-gradient-to-t from-plomo-900 via-plomo-900/40 to-celeste/20 mix-blend-multiply" />
        
        {/* Texto motivacional alineado al enfoque de negocio del documento */}
        <div className="absolute bottom-16 left-16 right-16 z-20 text-white">
          <span className="bg-celeste/90 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block backdrop-blur-sm">
            Enfoque Personalizado
          </span>
          <h1 className="text-4xl font-black tracking-tight leading-none mb-4">
            Aprende habilidades reales <br /> con mentores expertos.
          </h1>
          <p className="text-lg text-slate-200 font-medium max-w-md">
            Conexión directa, perfiles 100% verificados y un sistema ágil de pago por hora. Tu tiempo, tu ritmo.
          </p>
        </div>
      </div>

    </div>
  );
}