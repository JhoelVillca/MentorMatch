import React, { useEffect, useState } from 'react';

const PaquetesPage = () => {
    const [paquetes, setPaquetes] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [nuevoPaquete, setNuevoPaquete] = useState({
        titulo_paquete: '',
        cantidad_horas_totales: '',
        precio_total: ''
    });

    const API_URL = '/api/paquetes';

    // Función crucial: Genera las cabeceras que Jhoel solicitó
    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        };
    };

    // 1. GET con Autorización (Resuelve la observación de la imagen)
    const fetchPaquetes = async () => {
        try {
            const response = await fetch(`${API_URL}/me`, {
                method: 'GET',
                headers: getAuthHeaders() // Se incluye el token aquí
            });
            if (!response.ok) throw new Error('No autorizado o error de servidor');
            const data = await response.json();
            setPaquetes(data);
        } catch (error) {
            console.error("Error al cargar paquetes:", error);
        }
    };

    useEffect(() => {
        fetchPaquetes();
    }, []);

    // 2. POST con Autorización
    const handleCrear = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/`, {
                method: 'POST',
                headers: getAuthHeaders(), // También requerido para crear
                body: JSON.stringify(nuevoPaquete) 
            });
            
            if (response.ok) {
                setIsModalOpen(false);
                fetchPaquetes();
                setNuevoPaquete({ titulo_paquete: '', cantidad_horas_totales: '', precio_total: '' });
            }
        } catch (error) {
            console.error("Error en el POST:", error);
        }
    };

    // 3. PATCH con Autorización
    const handleToggleStatus = async (id, estadoActual) => {
        try {
            await fetch(`${API_URL}/${id}/status`, {
                method: 'PATCH',
                headers: getAuthHeaders(), // Requerido para modificar
                body: JSON.stringify({ estado_activo: !estadoActual })
            });
            fetchPaquetes();
        } catch (error) {
            console.error("Error al actualizar:", error);
        }
    };

    return (
        <div className="p-8 bg-gray-900 min-h-screen text-white">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-indigo-400">Panel de Paquetes</h1>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl font-bold transition-all"
                >
                    + Nuevo Paquete
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paquetes.map((p) => (
                    <div key={p.id_paquete} className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">{p.titulo_paquete}</h3>
                            <div className={`h-3 w-3 rounded-full ${p.estado_activo ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                        <p className="text-gray-400 mb-4">
                            {p.cantidad_horas_totales} Horas - <span className="text-indigo-400 font-bold">${p.precio_total}</span>
                        </p>
                        <button 
                            onClick={() => handleToggleStatus(p.id_paquete, p.estado_activo)}
                            className="w-full py-2 bg-gray-700 rounded-lg hover:bg-indigo-600 transition-colors"
                        >
                            {p.estado_activo ? 'Desactivar' : 'Activar'}
                        </button>
                    </div>
                ))}
            </div>

            {/* Modal de Creación simplificado */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-6">Crear Paquete</h2>
                        <form onSubmit={handleCrear} className="space-y-4">
                            <input 
                                type="text" placeholder="Título" required 
                                value={nuevoPaquete.titulo_paquete}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500"
                                onChange={(e) => setNuevoPaquete({...nuevoPaquete, titulo_paquete: e.target.value})}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input 
                                    type="number" placeholder="Horas" required 
                                    value={nuevoPaquete.cantidad_horas_totales}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500"
                                    onChange={(e) => setNuevoPaquete({...nuevoPaquete, cantidad_horas_totales: e.target.value})}
                                />
                                <input 
                                    type="number" step="0.01" placeholder="Precio" required 
                                    value={nuevoPaquete.precio_total}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500"
                                    onChange={(e) => setNuevoPaquete({...nuevoPaquete, precio_total: e.target.value})}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" className="flex-1 bg-indigo-600 py-3 rounded-lg font-bold">Guardar</button>
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