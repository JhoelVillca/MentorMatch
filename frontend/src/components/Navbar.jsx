import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { getUnreadCount } from '../services/chatService';

export default function Navbar() {
  const { token, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    let active = true;

    const fetchCount = () => {
      getUnreadCount()
        .then((data) => {
          if (active) setUnreadCount(data.total || 0);
        })
        .catch(() => {});
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const MensajesLink = () => (
    <Link to="/chat" className="relative hover:text-white px-3 py-2 text-sm font-medium">
      Mensajes
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );

  return (
    <nav className="bg-[#0a0a0a] border-b border-red-900/30 text-gray-300 font-['Poppins'] sticky top-0 z-50 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex-shrink-0">
            <Link to={token ? `/${userRole}` : "/"} className="text-xl font-bold tracking-wider text-white">
              Mentor<span className="text-red-600">Match</span>
            </Link>
          </div>

          {/* Nav Links based on State */}
          <div className="flex space-x-4 items-center">
            {!token ? (
              <>
                <Link to="/login" className="hover:text-red-500 transition-colors px-3 py-2 text-sm font-medium">
                  Iniciar Sesion
                </Link>
                <Link to="/register" className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-all">
                  Registrarse
                </Link>
              </>
            ) : (
              <>
                {userRole === 'admin' && (
                  <>
                    <Link to="/admin" className="hover:text-white px-3 py-2 text-sm font-medium">Panel Admin</Link>
                    <MensajesLink />
                  </>
                )}

                {userRole === 'mentor' && (
                  <>
                    <Link to="/mentor" className="hover:text-white px-3 py-2 text-sm font-medium">Mi Panel</Link>
                    <MensajesLink />
                    <Link to="/mentor/paquetes" className="hover:text-white px-3 py-2 text-sm font-medium">Mis Paquetes</Link>
                    <Link to="/mentor/horarios" className="hover:text-white px-3 py-2 text-sm font-medium">Mis Horarios</Link>
                    <Link to="/mentor/completar-perfil" className="hover:text-white px-3 py-2 text-sm font-medium">Mi Perfil</Link>
                  </>
                )}

                {userRole === 'mentee' && (
                  <>
                    <Link to="/mentee" className="hover:text-white px-3 py-2 text-sm font-medium">Mi Panel</Link>
                    <MensajesLink />
                    <Link to="/mentee/marketplace" className="hover:text-white px-3 py-2 text-sm font-medium">Marketplace</Link>
                    <Link to="/mentee/agendar" className="hover:text-white px-3 py-2 text-sm font-medium">Agendar</Link>
                    <Link to="/mentee/completar-perfil" className="hover:text-white px-3 py-2 text-sm font-medium">Mi Perfil</Link>
                    <Link to="/mentee/contratos" className="hover:text-white px-3 py-2 text-sm font-medium">Mis Contratos</Link>
                  </>
                )}

                <button 
                  onClick={handleLogout} 
                  className="ml-4 bg-transparent border border-red-800 text-red-500 hover:bg-red-900/40 hover:text-red-400 px-4 py-2 rounded-md text-sm font-medium transition-all"
                >
                  Cerrar Sesion
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}