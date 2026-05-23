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

  return (
    // Fondo adaptativo: Gris claro en Light, Plomo Profundo Asfalto en Dark
    <div className="min-h-screen bg-background dark:bg-plomo-darkCanvas font-['Poppins'] flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300 relative overflow-hidden">
      
      {/* Efecto de Luces de Fondo Creativas (Celeste y Plomo corporativo) */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-celeste/20 dark:bg-celeste/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-plomo-700/20 dark:bg-plomo-800/30 blur-[80px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-plomo-900 dark:text-white tracking-tight">
          MentorMatch
        </h2>
        <p className="mt-2 text-center text-sm text-plomo-700 dark:text-plomo-100/70">
          O{' '}
          <Link to="/register" className="font-semibold text-celeste hover:text-celeste-dark transition-colors">
            crea una cuenta nueva si eres nuevo
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        {/* Tarjeta de Formulario Adaptativa */}
        <div className="bg-surface dark:bg-plomo-darkSurface py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-plomo-100 dark:border-plomo-700/50 backdrop-blur-sm transition-all duration-300">
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-plomo-700 dark:text-plomo-100">
                Correo Electrónico
              </label>
              <div className="mt-1">
                <input 
                  type="email" 
                  placeholder="ejemplo@correo.com" 
                  id="username"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="appearance-none block w-full px-3 py-2.5 border border-plomo-100 dark:border-plomo-700 bg-background dark:bg-plomo-darkCanvas text-plomo-900 dark:text-white rounded-lg shadow-sm placeholder-plomo-700/40 dark:placeholder-plomo-100/30 focus:outline-none focus:ring-2 focus:ring-celeste focus:border-transparent sm:text-sm transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-plomo-700 dark:text-plomo-100">
                Contraseña
              </label>
              <div className="mt-1">
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  id="password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="appearance-none block w-full px-3 py-2.5 border border-plomo-100 dark:border-plomo-700 bg-background dark:bg-plomo-darkCanvas text-plomo-900 dark:text-white rounded-lg shadow-sm placeholder-plomo-700/40 dark:placeholder-plomo-100/30 focus:outline-none focus:ring-2 focus:ring-celeste focus:border-transparent sm:text-sm transition-all duration-200"
                />
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
                {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
              </button>
            </div>
          </form>
          
          {error && (
            <div className="mt-5 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-3 rounded text-red-700 dark:text-red-400 text-center text-sm font-medium transition-all">
              {typeof error === 'object' ? JSON.stringify(error) : error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}