import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ShieldCheck, User } from 'lucide-react';

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
          </div>
        </div>

        {perfil.habilidades?.length > 0 && (
          <div className="mt-7 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Habilidades</h3>
            <div className="flex flex-wrap gap-2">
              {perfil.habilidades.map((h, i) => (
                <span
                  key={i}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${
                    h.validada_por_admin
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {h.nombre_habilidad}
                  {h.validada_por_admin && <ShieldCheck size={11} />}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
