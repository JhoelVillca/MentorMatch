import { useState, useEffect } from 'react';
import { Check, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';

export default function Packages() {
  const [paquetes, setPaquetes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient('/api/paquetes/buscar', { method: 'GET' })
      .then(data => {
        // Mostramos solo los 3 primeros paquetes para la landing page
        setPaquetes((data || []).slice(0, 3));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="paquetes" className="relative py-24 sm:py-32 bg-white">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <span className="text-sm font-semibold text-primary-600 tracking-wider uppercase">
            Mentores Destacados
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            Descubre a tu próximo{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-accent-500">Mentor</span>
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            Precios claros y sin sorpresas. Explora los paquetes de mentoría más populares y comienza tu camino hoy.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-6 max-w-6xl mx-auto">
          {loading ? (
            <div className="col-span-3 flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : paquetes.length === 0 ? (
            <div className="col-span-3 text-center text-slate-500 py-12">No hay paquetes destacados en este momento.</div>
          ) : (
            paquetes.map((pkg, index) => {
              const isPopular = index === 1; // El del medio destacará visualmente
              return (
                <div
                  key={pkg.id_paquete}
                  className={`relative flex flex-col rounded-3xl p-8 shadow-sm transition-all duration-300 hover:shadow-xl ${
                    isPopular 
                      ? 'bg-gradient-to-b from-primary-900 to-slate-900 border border-primary-800 text-white transform md:-translate-y-4' 
                      : 'bg-white border border-slate-200 text-slate-900'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 inset-x-0 flex justify-center">
                      <span className="bg-gradient-to-r from-primary-500 to-accent-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                        Más Elegido
                      </span>
                    </div>
                  )}

                  {/* Perfil del Mentor */}
                  <div className="flex items-center gap-3 mb-6">
                    {pkg.mentor_foto ? (
                      <img src={pkg.mentor_foto} alt={pkg.mentor_nombre} className="w-12 h-12 rounded-full object-cover border-2 border-primary-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border-2 border-primary-200">
                        {pkg.mentor_nombre?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className={`font-semibold ${isPopular ? 'text-white' : 'text-slate-900'}`}>{pkg.mentor_nombre}</h4>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className={isPopular ? 'text-slate-300' : 'text-slate-600'}>
                          {pkg.calificacion_promedio ? pkg.calificacion_promedio : 'Nuevo'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className={`text-xl font-bold mb-2 line-clamp-1 ${isPopular ? 'text-white' : 'text-slate-900'}`} title={pkg.titulo_paquete}>
                      {pkg.titulo_paquete}
                    </h3>
                    <p className={`text-sm ${isPopular ? 'text-slate-300' : 'text-slate-500'}`}>Mentoría personalizada con enfoque directo a tus necesidades.</p>
                  </div>

                  <div className="mb-6 flex items-baseline gap-2">
                    <span className={`text-5xl font-extrabold tracking-tight ${isPopular ? 'text-white' : 'text-slate-900'}`}>
                      ${pkg.precio_total}
                    </span>
                    <span className={`text-sm font-medium ${isPopular ? 'text-slate-400' : 'text-slate-500'}`}>
                      / {pkg.cantidad_horas_totales} {pkg.cantidad_horas_totales === 1 ? 'hora' : 'horas'}
                    </span>
                  </div>

                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-start gap-3">
                      <Check className={`w-5 h-5 shrink-0 ${isPopular ? 'text-accent-400' : 'text-primary-600'}`} />
                      <span className={`text-sm ${isPopular ? 'text-slate-300' : 'text-slate-600'}`}>
                        {pkg.cantidad_horas_totales} {pkg.cantidad_horas_totales === 1 ? 'Hora' : 'Horas'} de sesión 1 a 1
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className={`w-5 h-5 shrink-0 ${isPopular ? 'text-accent-400' : 'text-primary-600'}`} />
                      <span className={`text-sm ${isPopular ? 'text-slate-300' : 'text-slate-600'}`}>Videollamadas integradas</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className={`w-5 h-5 shrink-0 ${isPopular ? 'text-accent-400' : 'text-primary-600'}`} />
                      <span className={`text-sm ${isPopular ? 'text-slate-300' : 'text-slate-600'}`}>Chat directo incluido</span>
                    </li>
                  </ul>

                  <Link
                    to="/catalog"
                    className={`w-full py-4 px-6 rounded-xl text-center font-semibold text-sm transition-all duration-300 ${
                      isPopular
                        ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:shadow-lg hover:shadow-primary-500/25'
                        : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                    }`}
                  >
                    Ver en Catálogo
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
