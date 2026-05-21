import { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

export default function MisContratos() {
  const [contratos, setContratos] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient('/api/contratos/me', { method: 'GET' })
      .then(data => setContratos(data))
      .catch(err => setError(err.message));
  }, []);

  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-4">Mis Contratos</h1>
      {error && <p className="text-red-500">{error}</p>}
      <ul>
        {contratos.map(c => (
          <li key={c.id_contrato} className="mb-2 p-2 border border-gray-700 rounded">
            <strong>{c.paquete}</strong> - Estado: {c.estado} | Horas usadas: {c.horas_consumidas}
          </li>
        ))}
      </ul>
    </div>
  );
}