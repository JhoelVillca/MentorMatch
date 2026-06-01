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
        <div 
            className="min-h-screen bg-cover bg-center bg-fixed p-6 sm:p-12 text-white"
            style={{ 
                backgroundImage: "url('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2074&auto=format&fit=crop')",
            }}
        >
            {/* Contenedor Glassmorphism Principal */}
            <div className="max-w-6xl mx-auto rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl p-8">
                
                {errorMessage && (
                    <div className="mb-6 rounded-xl border border-red-500/30 bg-red-900/40 px-4 py-3 text-red-200">
                        {errorMessage}
                    </div>
                )}

                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-4xl font-extrabold tracking-tight">Panel de Paquetes</h1>
                    <button 
                        onClick={handleOpenNew}
                        className="bg-gradient-to-r from-pink-600 to-violet-600 hover:opacity-90 px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:scale-105"
                    >
                        + Nuevo Paquete
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paquetes.map((p) => (
                        <div key={p.id_paquete} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-lg hover:border-white/20 transition-all">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-xl font-semibold">{p.titulo_paquete}</h3>
                                <div className={`h-3 w-3 rounded-full ${p.estado_activo ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-500'}`}></div>
                            </div>
                            <p className={`text-sm mb-4 font-bold ${getStatusColor(p.estado_validacion)}`}>{p.estado_validacion.toUpperCase()}</p>
                            <p className="text-white/70 mb-4">{p.cantidad_horas_totales} Horas - <span className="text-pink-400 font-bold">${p.precio_total}</span></p>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleToggleStatus(p.id_paquete, p.estado_activo)} 
                                    className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    {p.estado_activo ? 'Desactivar' : 'Activar'}
                                </button>
                                <button 
                                    onClick={() => handleOpenEdit(p)} 
                                    className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    Editar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal Glassmorphism */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-900/80 border border-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6 text-white">{editId ? 'Editar Paquete' : 'Crear Paquete'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input 
                                type="text" placeholder="Título del paquete" required value={formData.titulo_paquete}
                                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                                onChange={(e) => setFormData({...formData, titulo_paquete: e.target.value})}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input 
                                    type="number" placeholder="Horas" required value={formData.cantidad_horas_totales}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                                    onChange={(e) => setFormData({...formData, cantidad_horas_totales: e.target.value})}
                                />
                                <input 
                                    type="number" step="0.01" placeholder="Precio ($)" required value={formData.precio_total}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                                    onChange={(e) => setFormData({...formData, precio_total: e.target.value})}
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button 
                                    type="submit" disabled={isSubmitting} 
                                    className="flex-1 bg-gradient-to-r from-pink-600 to-violet-600 py-3 rounded-xl font-bold disabled:opacity-50 transition-all"
                                >
                                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                                </button>
                                <button 
                                    type="button" onClick={() => setIsModalOpen(false)} 
                                    className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-xl transition-all"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaquetesPage;