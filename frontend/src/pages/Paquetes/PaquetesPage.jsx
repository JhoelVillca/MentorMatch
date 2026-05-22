import { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';

const PaquetesPage = () => {
    const [paquetes, setPaquetes] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    
    const [nuevoPaquete, setNuevoPaquete] = useState({
        titulo_paquete: '',
        cantidad_horas_totales: '',
        precio_total: ''
    });

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

    useEffect(() => {
        void (async () => {
            try {
                const data = await apiClient(`${API_URL}/me`, { method: 'GET' });
                setPaquetes(data);
                setErrorMessage('');
            } catch (error) {
                setErrorMessage(error?.message || 'No se pudieron cargar los paquetes.');
            }
        })();
    }, []);

    const handleCrear = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const payload = {
            titulo_paquete: nuevoPaquete.titulo_paquete,
            cantidad_horas_totales: parseInt(nuevoPaquete.cantidad_horas_totales, 10),
            precio_total: parseFloat(nuevoPaquete.precio_total)
        };

        try {
            await apiClient(`${API_URL}/`, {
                method: 'POST',
                body: payload 
            });
            
            setIsModalOpen(false);
            setErrorMessage('');
            fetchPaquetes();
            setNuevoPaquete({ titulo_paquete: '', cantidad_horas_totales: '', precio_total: '' });
        } catch (error) {
            setErrorMessage(error?.message || 'No se pudo crear el paquete.');
        } finally {
            setIsSubmitting(false);
        }
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
            setErrorMessage(error?.message || 'No se pudo actualizar el estado del paquete.');
        }
    };

    return (
        <div className="p-8 min-h-screen text-white">
            {errorMessage && (
                <div className="mb-6 rounded-xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-red-200">
                    {errorMessage}
                </div>
            )}

            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-red-400">Panel de Paquetes</h1>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-red-700 hover:bg-red-600 px-6 py-3 rounded-xl font-bold transition-all"
                >
                    + Nuevo Paquete
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paquetes.map((p) => (
                    <div key={p.id_paquete} className="bg-[#141414] border border-red-900/30 rounded-2xl p-6 shadow-xl hover:border-red-700/50 transition-colors">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">{p.titulo_paquete}</h3>
                            <div className={`h-3 w-3 rounded-full ${p.estado_activo ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                        <p className="text-gray-400 mb-4">
                            {p.cantidad_horas_totales} Horas - <span className="text-red-400 font-bold">${p.precio_total}</span>
                        </p>
                        <button 
                            onClick={() => handleToggleStatus(p.id_paquete, p.estado_activo)}
                            className="w-full py-2 bg-red-900/30 rounded-lg hover:bg-red-700/50 transition-colors"
                        >
                            {p.estado_activo ? 'Desactivar' : 'Activar'}
                        </button>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#141414] border border-red-900/30 rounded-2xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-6">Crear Paquete</h2>
                        <form onSubmit={handleCrear} className="space-y-4">
                            <input 
                                type="text" placeholder="Titulo" required 
                                value={nuevoPaquete.titulo_paquete}
                                className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 text-white outline-none focus:border-red-600"
                                onChange={(e) => setNuevoPaquete({...nuevoPaquete, titulo_paquete: e.target.value})}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input 
                                    type="number" placeholder="Horas (Int)" required 
                                    value={nuevoPaquete.cantidad_horas_totales}
                                    className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 text-white outline-none focus:border-red-600"
                                    onChange={(e) => setNuevoPaquete({...nuevoPaquete, cantidad_horas_totales: e.target.value})}
                                />
                                <input 
                                    type="number" step="0.01" placeholder="Precio (Float)" required 
                                    value={nuevoPaquete.precio_total}
                                    className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 text-white outline-none focus:border-red-600"
                                    onChange={(e) => setNuevoPaquete({...nuevoPaquete, precio_total: e.target.value})}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="flex-1 bg-red-700 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                                </button>
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