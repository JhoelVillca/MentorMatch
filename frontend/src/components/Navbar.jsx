import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import {
  GraduationCap, LayoutDashboard, MessageSquare, Package, Clock,
  User, BookOpen, Calendar, FileText, LogOut, Menu, X, RefreshCcw
} from 'lucide-react';

const DEMO_ROLES = [
  { role: 'mentor', label: 'Mentor', home: '/mentor' },
  { role: 'mentee', label: 'Mentee', home: '/mentee' },
  { role: 'admin', label: 'Admin', home: '/admin' },
];

export default function Navbar() {
  const { token, userRole, switchRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (token) {
      import('../services/chatService').then(mod => {
        mod.getUnreadCount()
          .then(data => setUnreadCount(data.unread_total || 0))
          .catch(() => {});
      });
    }
  }, [token, location.pathname]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  // El enrutador logico del switch
  const handleSwitchRole = () => {
    if (userRole === 'mentor') {
      switchRole('mentee');
      navigate('/mentee');
    } else if (userRole === 'mentee') {
      switchRole('mentor');
      navigate('/mentor');
    }
  };

  const mentorLinks = [
    { to: '/mentor', label: 'Panel', icon: LayoutDashboard },
    { to: '/chat', label: 'Mensajes', icon: MessageSquare, badge: unreadCount },
    { to: '/mentor/paquetes', label: 'Paquetes', icon: Package },
    { to: '/mentor/horarios', label: 'Horarios', icon: Clock },
    { to: '/mentor/completar-perfil', label: 'Mi Perfil', icon: User },
  ];

  const menteeLinks = [
    { to: '/mentee', label: 'Panel', icon: LayoutDashboard },
    { to: '/chat', label: 'Mensajes', icon: MessageSquare, badge: unreadCount },
    { to: '/catalog', label: 'Catálogo', icon: BookOpen },
    { to: '/mentee/agendar', label: 'Agendar', icon: Calendar },
    { to: '/mentee/contratos', label: 'Contratos', icon: FileText },
    { to: '/mentee/completar-perfil', label: 'Mi Perfil', icon: User },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Administración', icon: LayoutDashboard },
    { to: '/chat', label: 'Mensajes', icon: MessageSquare, badge: unreadCount },
  ];

  const links = userRole === 'mentor' ? mentorLinks : userRole === 'mentee' ? menteeLinks : adminLinks;

  const isActive = (to) => {
    if (to === '/chat') {
      return location.pathname.startsWith('/chat');
    }
    return location.pathname === to || location.pathname === `${to}/`;
  };

  return (


      <nav className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-slate-200'
          : 'bg-white border-slate-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            <Link to={token ? `/${userRole}` : '/'} className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-600/20 group-hover:shadow-primary-500/30 transition-shadow">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                Mentor<span className="text-primary-600">Match</span>
              </span>
            </Link>

            {token ? (
              <div className="hidden md:flex items-center gap-0.5">
                {links.map(({ to, label, icon: Icon, badge }) => {
                  const active = isActive(to);
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                        active
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={15} className={active ? 'text-primary-500' : ''} />
                      {label}
                      {active && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500" />
                      )}
                      {badge > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center leading-none">
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
                <div className="w-px h-5 bg-slate-200 mx-2" />
                
                {/* BOTON DE CAMBIO DE ROL ESCRITORIO */}
                {(userRole === 'mentor' || userRole === 'mentee') && (
                  <button
                    onClick={handleSwitchRole}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all duration-150"
                  >
                    <RefreshCcw size={15} />
                    {userRole === 'mentor' ? 'Modo Alumno' : 'Modo Mentor'}
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150"
                >
                  <LogOut size={15} />
                  Salir
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/catalog" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all">Catálogo</Link>
                <Link to="/login" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all">Iniciar sesión</Link>
                <Link to="/register" className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm shadow-primary-600/20 transition-all">Registrarse</Link>
              </div>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
            >
              <div className={`transition-transform duration-200 ${mobileOpen ? 'rotate-90' : ''}`}>
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu — CSS height transition */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="bg-white border-t border-slate-100 shadow-sm px-4 py-3 space-y-1">
            {token ? (
              <>
                {links.map(({ to, label, icon: Icon, badge }) => {
                  const active = isActive(to);
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                        active ? 'text-primary-700 bg-primary-50' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={16} className={active ? 'text-primary-500' : 'text-slate-400'} />
                      {label}
                      {badge > 0 && (
                        <span className="ml-auto bg-primary-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
                <div className="pt-2 mt-2 border-t border-slate-100 space-y-1">
                  
                  {/* BOTON DE CAMBIO DE ROL MOBILE */}
                  {(userRole === 'mentor' || userRole === 'mentee') && (
                    <button
                      onClick={() => { handleSwitchRole(); setMobileOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                    >
                      <RefreshCcw size={16} />
                      {userRole === 'mentor' ? 'Cambiar a modo Alumno' : 'Cambiar a modo Mentor'}
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <LogOut size={16} />
                    Cerrar sesión
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/catalog" className="block px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg">Catálogo</Link>
                <Link to="/login" className="block px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg">Iniciar sesión</Link>
                <Link to="/register" className="block px-3 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg text-center">Registrarse</Link>
              </>
            )}
          </div>
        </div>
      </nav>
  );
}
