import { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';

const PaquetesPage = () => {
  const [paquetes, setPaquetes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ titulo_paquete: '', cantidad_horas_totales: '', precio_total: '' });

  const API_URL = '/api/paquetes';

  const fetchPaquetes = async () => {
    try {
      const data = await apiClient(`${API_URL}/me`, { method: 'GET' });
      setPaquetes(data);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error?.message || 'No se pudieron cargar los paquetes.');
    }
  };

  useEffect(() => { fetchPaquetes(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      titulo_paquete: formData.titulo_paquete,
      cantidad_horas_totales: parseInt(formData.cantidad_horas_totales, 10),
      precio_total: parseFloat(formData.precio_total)
    };
    try {
      if (editId) {
        await apiClient(`${API_URL}/${editId}`, { method: 'PATCH', body: payload });
      } else {
        await apiClient(`${API_URL}/`, { method: 'POST', body: payload });
      }
      setIsModalOpen(false);
      fetchPaquetes();
    } catch (error) {
      setErrorMessage(error?.message || 'Operación fallida.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (p) => {
    setEditId(p.id_paquete);
    setFormData({ titulo_paquete: p.titulo_paquete, cantidad_horas_totales: p.cantidad_horas_totales, precio_total: p.precio_total });
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditId(null);
    setFormData({ titulo_paquete: '', cantidad_horas_totales: '', precio_total: '' });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (id, estadoActual) => {
    try {
      await apiClient(`${API_URL}/${id}/status`, { method: 'PATCH', body: { estado_activo: !estadoActual } });
      fetchPaquetes();
    } catch (error) {
      setErrorMessage(error?.message || 'No se pudo actualizar.');
    }
  };

  const getStatusColor = (v) => v === 'aprobado' ? 'text-blue-300' : v === 'rechazado' ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="relative min-h-screen text-white p-8">
      {/* Fondo abstracto y triste */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1518972450530-5883731804f5?q=80&w=2000")',
          filter: 'grayscale(100%) brightness(0.25) contrast(1.2)' 
        }}
      ></div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {errorMessage && (
          <div className="mb-6 rounded-lg border border-gray-600 bg-gray-900/80 px-4 py-3 text-gray-300">
            {errorMessage}
          </div>
        )}

        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-light tracking-widest text-gray-200">Panel de Paquetes</h1>
          <button onClick={handleOpenNew} className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-lg transition-all text-sm uppercase tracking-tighter">
            + Nuevo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paquetes.map((p) => (
            <div key={p.id_paquete} className="bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl p-6 transition-all hover:bg-black/50">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">{p.titulo_paquete}</h3>
                <div className={`h-2 w-2 rounded-full ${p.estado_activo ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
              </div>
              <p className={`text-[10px] mb-4 uppercase tracking-widest ${getStatusColor(p.estado_validacion)}`}>{p.estado_validacion?.toUpperCase() || 'PENDIENTE'}</p>
              <p className="text-gray-400 mb-6 text-sm">{p.cantidad_horas_totales} Horas — <span className="text-gray-200">${p.precio_total}</span></p>
              <div className="flex gap-2">
                <button onClick={() => handleToggleStatus(p.id_paquete, p.estado_activo)} className="flex-1 py-2 bg-white/5 rounded text-[11px] uppercase hover:bg-white/10 transition-colors">{p.estado_activo ? 'Desactivar' : 'Activar'}</button>
                <button onClick={() => handleOpenEdit(p)} className="flex-1 py-2 border border-white/10 rounded text-[11px] uppercase hover:bg-white/5 transition-colors">Editar</button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal (funcionalidad completa) */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-8 max-w-md w-full">
              <h2 className="text-xl font-light mb-6 text-gray-300">{editId ? 'Editar Paquete' : 'Crear Paquete'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" placeholder="Título" required value={formData.titulo_paquete}
                  className="w-full bg-black border border-white/10 rounded p-3 text-sm focus:outline-none"
                  onChange={(e) => setFormData({...formData, titulo_paquete: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Horas" required value={formData.cantidad_horas_totales}
                    className="w-full bg-black border border-white/10 rounded p-3 text-sm focus:outline-none"
                    onChange={(e) => setFormData({...formData, cantidad_horas_totales: e.target.value})}
                  />
                  <input type="number" step="0.01" placeholder="Precio" required value={formData.precio_total}
                    className="w-full bg-black border border-white/10 rounded p-3 text-sm focus:outline-none"
                    onChange={(e) => setFormData({...formData, precio_total: e.target.value})}
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button type="submit" disabled={isSubmitting} className="flex-1 bg-white text-black py-3 rounded text-xs font-bold uppercase">{isSubmitting ? '...' : 'Guardar'}</button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 border border-white/20 py-3 rounded text-xs uppercase">Cerrar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaquetesPage;