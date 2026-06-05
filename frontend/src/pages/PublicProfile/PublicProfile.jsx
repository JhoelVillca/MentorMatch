import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function PublicProfile() {
  const { id } = useParams();
  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient(`/api/profiles/mentor/${id}`, { method: 'GET' })
      .then(setPerfil)
      .catch(err => setError(err.message));
  }, [id]);

  if (error) return <div className="text-red-500 text-center mt-10">Error: {error}</div>;
  if (!perfil) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10">
      <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-center shadow-2xl">
        <img 
          src={perfil.foto_perfil || 'https://via.placeholder.com/150'} 
          alt={perfil.nombre_completo}
          className="w-40 h-40 rounded-full object-cover border-4 border-blue-600 shadow-lg"
        />
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-white mb-2">{perfil.nombre_completo}</h1>
          <p className="text-gray-400 italic mb-4">{perfil.biografia_profesional}</p>
          
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-white mb-3">Arsenal Técnico</h3>
            <div className="flex flex-wrap gap-2">
              {perfil.habilidades?.map((h, i) => (
                <span 
                  key={i} 
                  className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                    h.validada_por_admin ? 'bg-green-900/30 text-green-400 border border-green-700/50' : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}
                >
                  {h.nombre_habilidad}
                  {h.validada_por_admin && (
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.642 2 6.31 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.69-.056-1.358-.166-2.001A11.954 11.954 0 0110 1.944zM10 4a9.954 9.954 0 00-6.143 2.1c.148 3.513 1.77 6.643 4.316 8.528A7.962 7.962 0 0110 16a7.962 7.962 0 01-1.827-1.372c2.546-1.885 4.168-5.015 4.316-8.528A9.954 9.954 0 0010 4z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
