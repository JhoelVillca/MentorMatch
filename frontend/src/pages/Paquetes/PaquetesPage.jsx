import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import './PaquetesPage.css'; // Estilos Cyber-Neon

const PaquetesPage = () => {
    const [paquetes, setPaquetes] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { token } = useAuth(); 
    
    const [nuevoPaquete, setNuevoPaquete] = useState({
        titulo_paquete: '',
        cantidad_horas_totales: '',
        precio_total: ''
    });

    const API_URL = '/api/paquetes';

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
    });

    const fetchPaquetes = async () => {
        if (!token) return;
        try {
            const response = await fetch(`${API_URL}/me`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error('No autorizado');
            const data = await response.json();
            setPaquetes(data);
        } catch (error) {
            console.error("Error al cargar paquetes:", error);
        }
    };

    useEffect(() => {
        fetchPaquetes();
    }, [token]);

    const handleCrear = async (e) => {
        e.preventDefault();
        
        // Conversión de tipos para el backend
        const payload = {
            titulo_paquete: nuevoPaquete.titulo_paquete,
            cantidad_horas_totales: parseInt(nuevoPaquete.cantidad_horas_totales, 10),
            precio_total: parseFloat(nuevoPaquete.precio_total)
        };

        try {
            const response = await fetch(`${API_URL}/`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload) 
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

    const handleToggleStatus = async (id, estadoActual) => {
        try {
            await fetch(`${API_URL}/${id}/status`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ estado_activo: !estadoActual })
            });
            fetchPaquetes();
        } catch (error) {
            console.error("Error al actualizar:", error);
        }
    };

    return (
        <div className="paquetes-wrapper">
            <div className="paquetes-header">
                <h1>Gestión de Paquetes</h1>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="btn-nuevo-paquete"
                >
                    + Nuevo Paquete
                </button>
            </div>

            <div className="paquetes-grid">
                {paquetes.map((p) => (
                    <div key={p.id_paquete} className="paquete-card">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">{p.titulo_paquete}</h3>
                            <div className={`status-indicator ${p.estado_activo ? 'status-active' : 'status-inactive'}`}></div>
                        </div>
                        <p className="text-gray-400 mb-6">
                            {p.cantidad_horas_totales} Horas - <span className="text-red-500 font-bold">${p.precio_total}</span>
                        </p>
                        <button 
                            onClick={() => handleToggleStatus(p.id_paquete, p.estado_activo)}
                            className="btn-toggle-status"
                        >
                            {p.estado_activo ? 'Desactivar' : 'Activar'}
                        </button>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="text-2xl font-bold mb-6 text-white uppercase tracking-widest">Crear Paquete</h2>
                        <form onSubmit={handleCrear} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs text-red-400 font-bold uppercase">Título del Paquete</label>
                                <input 
                                    type="text" placeholder="Ej. Mentoría Web Intensiva" required 
                                    value={nuevoPaquete.titulo_paquete}
                                    className="cyber-input"
                                    onChange={(e) => setNuevoPaquete({...nuevoPaquete, titulo_paquete: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-red-400 font-bold uppercase">Horas</label>
                                    <input 
                                        type="number" placeholder="0" required 
                                        value={nuevoPaquete.cantidad_horas_totales}
                                        className="cyber-input"
                                        onChange={(e) => setNuevoPaquete({...nuevoPaquete, cantidad_horas_totales: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-red-400 font-bold uppercase">Precio ($)</label>
                                    <input 
                                        type="number" step="0.01" placeholder="0.00" required 
                                        value={nuevoPaquete.precio_total}
                                        className="cyber-input"
                                        onChange={(e) => setNuevoPaquete({...nuevoPaquete, precio_total: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button type="submit" className="flex-1 btn-nuevo-paquete">Guardar</button>
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)} 
                                    className="flex-1 py-3 rounded-lg bg-gray-800 text-gray-300 font-bold hover:bg-gray-700 transition-colors"
                                >
                                    Cancelar
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