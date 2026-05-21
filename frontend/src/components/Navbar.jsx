import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { token, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
                  Iniciar Sesión
                </Link>
                <Link to="/register" className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-all">
                  Registrarse
                </Link>
              </>
            ) : (
              <>
                {/* Rutas Admin */}
                {userRole === 'admin' && (
                  <Link to="/admin" className="hover:text-white px-3 py-2 text-sm font-medium">Panel Admin</Link>
                )}

                {/* Rutas Mentor */}
                {userRole === 'mentor' && (
                  <>
                    <Link to="/mentor" className="hover:text-white px-3 py-2 text-sm font-medium">Mi Panel</Link>
                    <Link to="/mentor/paquetes" className="hover:text-white px-3 py-2 text-sm font-medium">Mis Paquetes</Link>
                    {/* Placeholder para cuando implementes horarios visuales completos */}
                    <Link to="/mentor/horarios" className="hover:text-white px-3 py-2 text-sm font-medium">Mis Horarios</Link>
                    <Link to="/mentor/completar-perfil" className="hover:text-white px-3 py-2 text-sm font-medium">Mi Perfil</Link>
                  </>
                )}

                {/* Rutas Mentee */}
                {userRole === 'mentee' && (
                  <>
                    <Link to="/mentee" className="hover:text-white px-3 py-2 text-sm font-medium">Mi Panel</Link>
                    <Link to="/mentee/marketplace" className="hover:text-white px-3 py-2 text-sm font-medium">Marketplace</Link>
                    <Link to="/mentee/completar-perfil" className="hover:text-white px-3 py-2 text-sm font-medium">Mi Perfil</Link>
                    <Link to="/mentee/contratos" className="hover:text-white px-3 py-2 text-sm font-medium">Mis Contratos</Link>
                  </>
                )}

                <button 
                  onClick={handleLogout} 
                  className="ml-4 bg-transparent border border-red-800 text-red-500 hover:bg-red-900/40 hover:text-red-400 px-4 py-2 rounded-md text-sm font-medium transition-all"
                >
                  Cerrar Sesión
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}