import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';

export default function Marketplace() {
  const [paquetes, setPaquetes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    
    const fetchMarketplace = async () => {
      try {
        const data = await apiClient('/api/paquetes/disponibles', { method: 'GET' });
        if (isMounted) setPaquetes(data);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMarketplace();
    return () => { isMounted = false; };
  }, []);

  const handleAdquirir = async (idPaquete) => {
    try {
      const res = await apiClient('/api/contratos/adquirir', {
        method: 'POST',
        body: { id_paquete: idPaquete }
      });
      alert(`Contrato generado: ${res.estado}. Redirigiendo...`);
      navigate('/mentee/contratos');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-red-900/30 border border-red-500 text-red-200 p-4 rounded-lg">
          Error al cargar el catalogo: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Escaparate de Mentores</h1>
        <p className="text-gray-400">Encuentra al experto ideal y adquiere tu paquete de horas.</p>
      </div>

      {paquetes.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-700 rounded-2xl">
          <p className="text-gray-400">No hay mentores disponibles en este momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paquetes.map((p) => (
            <div key={p.id_paquete} className="bg-[#141414] border border-red-900/30 rounded-2xl p-6 flex flex-col justify-between hover:border-red-600/50 transition-colors shadow-lg">
              
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-800">
                {p.mentor_foto ? (
                  <img src={p.mentor_foto} alt={p.mentor_nombre} className="w-14 h-14 rounded-full object-cover border-2 border-gray-700" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-xl border-2 border-gray-700">
                    {p.mentor_nombre.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white leading-tight">{p.mentor_nombre}</h3>
                  <span className="text-xs text-green-400 font-medium tracking-wide uppercase">Mentor Verificado</span>
                </div>
              </div>

              <div className="mb-6 flex-1">
                <h4 className="text-xl font-bold text-red-400 mb-2">{p.titulo_paquete}</h4>
                <div className="flex justify-between items-end mt-4">
                  <span className="text-gray-400 bg-[#0a0a0a] px-3 py-1 rounded-md text-sm">
                    {p.cantidad_horas_totales} Horas
                  </span>
                  <span className="text-2xl font-bold text-white">${p.precio_total}</span>
                </div>
              </div>

              <button
                onClick={() => handleAdquirir(p.id_paquete)}
                className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-md hover:shadow-red-900/20"
              >
                Adquirir Paquete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}