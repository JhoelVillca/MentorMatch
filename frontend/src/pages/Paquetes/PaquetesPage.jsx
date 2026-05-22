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
            setErrorMessage('');
            fetchPaquetes();
        } catch (error) {
            setErrorMessage(error?.message || 'Operacion fallida.');
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
            await apiClient(`${API_URL}/${id}/status`, {
                method: 'PATCH',
                body: { estado_activo: !estadoActual }
            });
            setErrorMessage('');
            fetchPaquetes();
        } catch (error) {
            setErrorMessage(error?.message || 'No se pudo actualizar.');
        }
    };

    const getStatusColor = (v) => v === 'aprobado' ? 'text-green-400' : v === 'rechazado' ? 'text-red-400' : 'text-yellow-400';

    return (
        <div className="p-8 min-h-screen text-white">
            {errorMessage && (
                <div className="mb-6 rounded-xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-red-200">
                    {errorMessage}
                </div>
            )}

            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-red-400">Panel de Paquetes</h1>
                <button onClick={handleOpenNew}
                    className="bg-red-700 hover:bg-red-600 px-6 py-3 rounded-xl font-bold transition-all"
                >
                    + Nuevo
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paquetes.map((p) => (
                    <div key={p.id_paquete} className="bg-[#141414] border border-red-900/30 rounded-2xl p-6 shadow-xl hover:border-red-700/50 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xl font-semibold">{p.titulo_paquete}</h3>
                            <div className={`h-3 w-3 rounded-full ${p.estado_activo ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                        <p className={`text-sm mb-4 font-bold ${getStatusColor(p.estado_validacion)}`}>{p.estado_validacion.toUpperCase()}</p>
                        <p className="text-gray-400 mb-4">{p.cantidad_horas_totales} Horas - <span className="text-red-400 font-bold">${p.precio_total}</span></p>
                        <div className="flex gap-2">
                            <button onClick={() => handleToggleStatus(p.id_paquete, p.estado_activo)} className="flex-1 py-2 bg-red-900/30 rounded-lg hover:bg-red-700/50 transition-colors">{p.estado_activo ? 'Desactivar' : 'Activar'}</button>
                            <button onClick={() => handleOpenEdit(p)} className="flex-1 py-2 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors">Editar</button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#141414] border border-red-900/30 rounded-2xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-6">{editId ? 'Editar Paquete' : 'Crear Paquete'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" placeholder="Titulo" required value={formData.titulo_paquete}
                                className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 text-white outline-none focus:border-red-600"
                                onChange={(e) => setFormData({...formData, titulo_paquete: e.target.value})}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" placeholder="Horas" required value={formData.cantidad_horas_totales}
                                    className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 text-white outline-none focus:border-red-600"
                                    onChange={(e) => setFormData({...formData, cantidad_horas_totales: e.target.value})}
                                />
                                <input type="number" step="0.01" placeholder="Precio" required value={formData.precio_total}
                                    className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 text-white outline-none focus:border-red-600"
                                    onChange={(e) => setFormData({...formData, precio_total: e.target.value})}
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="submit" disabled={isSubmitting} className="flex-1 bg-red-700 py-3 rounded-lg font-bold disabled:opacity-50">{isSubmitting ? 'Guardando...' : 'Guardar'}</button>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-700 py-3 rounded-lg">Cerrar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaquetesPage;