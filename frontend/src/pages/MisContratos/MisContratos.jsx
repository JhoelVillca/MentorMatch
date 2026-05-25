import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';

export default function MisContratos() {
  const [contratos, setContratos] = useState([]);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success') === 'true') {
      setSuccessMsg('Pago procesado. Tu contrato estara activo en segundos.');
      window.history.replaceState({}, '', '/mentee/contratos');
    }
  }, [location.search]);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 5000);
    return () => clearTimeout(t);
  }, [successMsg]);

  useEffect(() => {
    apiClient('/api/contratos/me', { method: 'GET' })
      .then((data) => setContratos(data))
      .catch((err) => setError(err.message));
  }, []);

  const estadoColor = (estado) => {
    switch (estado) {
      case 'activo': return 'text-green-400';
      case 'pendiente_pago': return 'text-yellow-400';
      case 'completado': return 'text-blue-400';
      case 'cancelado': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="p-8 text-white max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mis Contratos</h1>

      {successMsg && (
        <div className="mb-6 bg-green-900/30 border border-green-600/50 rounded-xl p-4 text-green-300 text-sm font-semibold">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-900/30 border border-red-600/50 rounded-xl p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {contratos.length === 0 && !error ? (
        <div className="text-center py-12 border border-dashed border-gray-700 rounded-2xl">
          <p className="text-gray-400">No tienes contratos aun.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {contratos.map((c) => (
            <li
              key={c.id_contrato}
              className="bg-[#141414] border border-gray-800 rounded-xl p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-white">{c.paquete}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Horas usadas: {c.horas_consumidas}
                </p>
              </div>
              <span className={`text-sm font-bold uppercase ${estadoColor(c.estado)}`}>
                {c.estado.replace('_', ' ')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}