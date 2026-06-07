import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, GraduationCap } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-600/20 group-hover:shadow-primary-500/30 transition-shadow">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              Mentor<span className="text-primary-600">Match</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {[
              { label: 'Beneficios', id: 'beneficios' },
              { label: 'Cómo Funciona', id: 'como-funciona' },
              { label: 'Testimonios', id: 'testimonios' },
              { label: 'Catálogo', id: 'catalogo' }
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all"
              >
                {item.label}
              </a>
            ))}
            <div className="ml-4 flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl transition-all"
              >
                Quiero Aprender
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl hover:from-primary-500 hover:to-primary-400 shadow-lg shadow-primary-600/20 hover:shadow-primary-500/30 transition-all"
              >
                Quiero ser Mentor
              </Link>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/60 shadow-lg">
          <div className="px-4 py-4 space-y-1">
            {[
              { label: 'Beneficios', id: 'beneficios' },
              { label: 'Cómo Funciona', id: 'como-funciona' },
              { label: 'Testimonios', id: 'testimonios' },
              { label: 'Catálogo', id: 'catalogo' }
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-3 mt-3 border-t border-slate-200 space-y-2">
              <Link
                to="/login"
                className="block px-4 py-2.5 text-sm text-center text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 hover:border-slate-300 transition-all"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="block px-4 py-2.5 text-sm text-center font-semibold text-primary-700 bg-primary-50 border border-primary-200 rounded-xl"
              >
                Quiero Aprender
              </Link>
              <Link
                to="/register"
                className="block px-4 py-2.5 text-sm text-center font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl"
              >
                Quiero ser Mentor
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
