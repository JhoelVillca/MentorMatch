import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ShieldCheck, User, CheckCircle, Globe, PlayCircle, ExternalLink } from 'lucide-react';

export default function PublicProfile() {
  const { id } = useParams();
  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient(`/api/profiles/mentor/${id}`, { method: 'GET' })
      .then(setPerfil)
      .catch(err => setError(err.message));
  }, [id]);

  if (error) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-red-600 text-sm">Error: {error}</p>
    </div>
  );
  if (!perfil) return <LoadingSpinner />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-8">
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <div className="flex-shrink-0">
            {perfil.foto_perfil ? (
              <img
                src={perfil.foto_perfil}
                alt={perfil.nombre_completo}
                className="w-28 h-28 rounded-full object-cover border-2 border-slate-200"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-primary-50 border-2 border-primary-100 flex items-center justify-center">
                <User size={40} className="text-primary-400" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">{perfil.nombre_completo}</h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full mb-3">
              <ShieldCheck size={11} />Verificado
            </span>
            {perfil.biografia_profesional && (
              <p className="text-sm text-slate-600 leading-relaxed mt-2">{perfil.biografia_profesional}</p>
            )}

            {/* Seccion de Redes y Presentacion */}
            {(perfil.url_linkedin || perfil.url_video_presentacion) && (
              <div className="mt-6 flex flex-wrap gap-4">
                {perfil.url_linkedin && (
                  <a
                    href={perfil.url_linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0077b5] text-white text-sm font-semibold rounded-xl hover:bg-[#005e93] transition-colors shadow-sm"
                  >
                    <Globe size={18} />
                    Perfil de LinkedIn
                    <ExternalLink size={14} className="ml-1 opacity-70" />
                  </a>
                )}

                {perfil.url_video_presentacion && (
                  <a
                    href={perfil.url_video_presentacion}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-900 transition-colors shadow-sm"
                  >
                    <PlayCircle size={18} />
                    Video de Presentacion
                    <ExternalLink size={14} className="ml-1 opacity-70" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Habilidades Destacadas</h2>
          <div className="flex flex-wrap gap-3">
            
            {perfil.habilidades?.map((h, i) => {
              const nombre = h.habilidad?.nombre_habilidad || 'Habilidad';
              const validada = h.habilidad?.validada_por_admin === true;

              return (
                <div 
                  key={i} 
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                    validada 
                      ? 'bg-green-50 border-green-200 shadow-sm shadow-green-100/50' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {validada && <CheckCircle size={16} className="text-green-600" />}
                  
                  <span className={`text-sm font-bold ${validada ? 'text-green-800' : 'text-slate-700'}`}>
                    {nombre}
                  </span>
                  
                  <div className="w-px h-4 bg-slate-200 mx-1" />
                  
                  <span className={`text-xs font-semibold ${validada ? 'text-green-600' : 'text-slate-500'}`}>
                    {h.nivel}
                  </span>
                  
                  <span className={`text-xs ${validada ? 'text-green-500' : 'text-slate-400'}`}>
                    • {h.anios_experiencia} años
                  </span>
                </div>
              );
            })}

            {(!perfil.habilidades || perfil.habilidades.length === 0) && (
              <p className="text-slate-500 text-sm italic">Este mentor aún no ha destacado sus habilidades específicas.</p>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
