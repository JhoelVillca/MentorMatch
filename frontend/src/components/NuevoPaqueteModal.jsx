import { useState } from 'react';

export default function NuevoPaqueteModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    titulo_paquete: '',
    cantidad_horas_totales: '',
    precio_total: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/paquetes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cantidad_horas_totales: parseInt(formData.cantidad_horas_totales),
          precio_total: parseFloat(formData.precio_total),
          estado_activo: true
        }),
      });

      if (response.ok) {
        onSave(); // Recarga la lista en App.jsx
        onClose(); // Cierra el modal
        setFormData({ titulo_paquete: '', cantidad_horas_totales: '', precio_total: '' });
      }
    } catch (error) {
      console.error("Error al crear el paquete:", error);
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h2>Crear Nuevo Paquete</h2>
        <form onSubmit={handleSubmit}>
          <input 
            type="text" placeholder="Título del paquete" required
            value={formData.titulo_paquete}
            onChange={(e) => setFormData({...formData, titulo_paquete: e.target.value})}
            style={inputStyle}
          />
          <input 
            type="number" placeholder="Cantidad de horas" required
            value={formData.cantidad_horas_totales}
            onChange={(e) => setFormData({...formData, cantidad_horas_totales: e.target.value})}
            style={inputStyle}
          />
          <input 
            type="number" step="0.01" placeholder="Precio total" required
            value={formData.precio_total}
            onChange={(e) => setFormData({...formData, precio_total: e.target.value})}
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="submit" style={btnSaveStyle}>Guardar Paquete</button>
            <button type="button" onClick={onClose} style={btnCancelStyle}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Estilos rápidos para el modal
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const modalContentStyle = { background: '#2c2c2c', padding: '30px', borderRadius: '10px', width: '400px', color: 'white' };
const inputStyle = { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #444', background: '#1e1e1e', color: 'white' };
const btnSaveStyle = { backgroundColor: '#4caf50', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer', flex: 1 };
const btnCancelStyle = { backgroundColor: '#f44336', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer', flex: 1 };