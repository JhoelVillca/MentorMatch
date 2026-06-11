import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { apiClient } from './services/apiClient';

const AuthContext = createContext();

const WAKE_MESSAGES = [
  'Conectando con MentorMatch…',
  'Despertando el servidor en la nube…',
  'Estableciendo enlace seguro…',
  'Casi listo, gracias por esperar…',
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [msgIdx, setMsgIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  const checkSession = async () => {
    try {
      const data = await apiClient('/api/auth/me', { method: 'GET' });
      setUser({ id: data.id, role: data.rol });
      setActiveRole((prev) => prev || data.rol); 
      return data;
    } catch (error) {
      setUser(null);
      setActiveRole(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    localStorage.removeItem('mentor_token');
    checkSession();
  }, []);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % WAKE_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [loading]);

  const login = async () => {
    return await checkSession();
  };

  const logout = async () => {
    try {
      await apiClient('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('access_token');
    setUser(null);
    setActiveRole(null);
  };

  // Funcion inyectada para el polimorfismo
  const switchRole = (newRole) => {
    setActiveRole(newRole);
  };

  return (
    <AuthContext.Provider value={{ token: user, userRole: activeRole, switchRole, login, logout, loading }}>
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white select-none overflow-hidden">

          {/* Animated pulse rings */}
          <div className="relative flex items-center justify-center mb-10">
            <div className="absolute h-24 w-24 rounded-full border border-red-900/30 animate-ping" style={{ animationDuration: '2.5s' }} />
            <div className="absolute h-20 w-20 rounded-full border border-red-800/20 animate-ping" style={{ animationDuration: '3.5s' }} />
            <div className="relative h-14 w-14 rounded-full border-2 border-transparent border-t-red-600 border-b-red-600 animate-spin" style={{ animationDuration: '1.2s' }} />
          </div>

          {/* Rotating status message */}
          <h2
            className="text-xl font-bold mb-2 transition-opacity duration-500"
            key={msgIdx}
            style={{ animation: 'fadeInUp 0.5s ease-out' }}
          >
            {WAKE_MESSAGES[msgIdx]}
          </h2>

          {/* Progress dots */}
          <div className="flex gap-1.5 mb-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-red-600"
                style={{
                  animation: 'pulse 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>

          {/* Cold-start explanation */}
          <p className="text-gray-500 text-sm max-w-sm text-center leading-relaxed">
            El servidor gratuito de Render entra en hibernación tras inactividad.
            El arranque en frío puede tomar hasta <span className="text-gray-400 font-semibold">50 segundos</span>.
          </p>

          {/* Elapsed time counter */}
          {elapsed >= 5 && (
            <p
              className="mt-4 text-xs text-gray-600 tabular-nums"
              style={{ animation: 'fadeInUp 0.4s ease-out' }}
            >
              Tiempo de espera: {elapsed}s
            </p>
          )}

          {/* Inline keyframes */}
          <style>{`
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(8px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);