import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, ArrowRight, GraduationCap } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export default function CatalogPreview() {
  const [paquetes, setPaquetes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Obtenemos una vista previa de los mentores (hasta 6)
    apiClient('/api/paquetes/buscar', { method: 'GET' })
      .then(data => {
        setPaquetes(data.slice(0, 6)); // Tomamos solo 6
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="catalogo" className="py-24 sm:py-32 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary-600 tracking-wider uppercase">
            Catálogo
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900">
            Aprende con los mejores
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            Nuestros mentores están listos para guiarte en tu próximo gran desafío.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden h-64 animate-pulse">
                <div className="h-full w-full bg-slate-100" />
              </div>
            ))}
          </div>
        ) : paquetes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
              <GraduationCap size={28} className="text-slate-300" />
            </div>
            <p className="text-slate-700 font-semibold">Catálogo en preparación</p>
            <p className="text-slate-400 text-sm mt-1">Pronto agregaremos mentores expertos a esta lista.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paquetes.map((p) => (
              <div
                key={p.id_paquete}
                onClick={() => navigate('/catalog')}
                className="cursor-pointer bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden group"
              >
                <div className="flex items-center gap-3 p-5 border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors">
                  {p.mentor_foto ? (
                    <img src={p.mentor_foto} alt={p.mentor_nombre} className="w-11 h-11 rounded-full object-cover border-2 border-slate-100" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm border-2 border-primary-50">
                      {p.mentor_nombre.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-primary-700">{p.mentor_nombre}</p>
                    {p.calificacion_promedio && (
                      <div className="flex items-center gap-0.5 text-amber-500 text-xs font-semibold mt-0.5">
                        <Star size={11} className="fill-current" />
                        {p.calificacion_promedio}
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 mb-2 leading-snug">{p.titulo_paquete}</h3>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Star size={11} className="text-slate-400" />
                        {p.cantidad_horas_totales} {p.cantidad_horas_totales === 1 ? 'hora' : 'horas'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <div>
                      <span className="text-xl font-bold text-slate-900">${p.precio_total}</span>
                      <span className="text-xs text-slate-400 ml-1">USD</span>
                    </div>
                    <span className="text-sm text-primary-600 font-medium group-hover:text-primary-700 flex items-center gap-1 transition-colors">
                      Adquirir <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-14 text-center">
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all shadow-sm"
          >
            Ver catálogo completo <ArrowRight size={18} className="text-slate-400" />
          </Link>
        </div>
      </div>
    </section>
  );
}
