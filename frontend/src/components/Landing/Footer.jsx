import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

const footerLinks = {
  Plataforma: [
    { label: 'Explorar Mentores', href: '/catalog' },
    { label: 'Quiero ser Mentor', href: '/register' },
    { label: 'Cómo Funciona', href: '#como-funciona' },
    { label: 'Paquetes', href: '#paquetes' },
  ],
  Legal: [
    { label: 'Términos de Servicio', href: '#' },
    { label: 'Política de Privacidad', href: '#' },
    { label: 'Cookies', href: '#' },
  ],
  Soporte: [
    { label: 'Centro de Ayuda', href: '#' },
    { label: 'Contacto', href: '#' },
    { label: 'FAQ', href: '#' },
  ],
};

export default function Footer() {
  return (
    <footer className="relative bg-slate-50 border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">
                Mentor<span className="text-primary-600">Match</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              Conectamos talento con experiencia. Mentoría personalizada para
              el profesional del mañana.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    {href.startsWith('#') ? (
                      <a
                        href={href}
                        className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        to={href}
                        className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} MentorMatch. Todos los derechos
            reservados.
          </p>
          <p className="text-xs text-slate-400">
            Pagos procesados por Stripe Connect
          </p>
        </div>
      </div>
    </footer>
  );
}
