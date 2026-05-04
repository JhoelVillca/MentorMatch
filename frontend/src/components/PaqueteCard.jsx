export default function PaqueteCard({ paquete, onToggle }) {
  return (
    <div style={{ 
      border: '1px solid #444', 
      padding: '20px', 
      borderRadius: '12px', 
      backgroundColor: '#1e1e1e',
      color: 'white',
      marginBottom: '10px'
    }}>
      <h3>{paquete.titulo_paquete}</h3>
      <p>Horas: {paquete.cantidad_horas_totales}</p>
      <p>Precio: ${paquete.precio_total}</p>
      <button 
        onClick={() => onToggle(paquete.id_paquete)}
        style={{ 
          backgroundColor: paquete.estado_activo ? '#ff4d4d' : '#4caf50',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {paquete.estado_activo ? 'Desactivar' : 'Activar'}
      </button>
    </div>
  );
}