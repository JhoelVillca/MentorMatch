import { useEffect, useState } from 'react'
import PaqueteCard from './components/PaqueteCard'
import NuevoPaqueteModal from './components/NuevoPaqueteModal' // Importar el nuevo modal

function App() {
  const [paquetes, setPaquetes] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false) // Estado para el modal

  const cargarPaquetes = async () => {
    try {
      const resp = await fetch('http://localhost:8000/api/paquetes/me')
      const data = await resp.json()
      setPaquetes(data)
    } catch (err) {
      console.error("Error conectando con el backend:", err)
    }
  }

  useEffect(() => {
    cargarPaquetes()
  }, [])

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Panel de Mentoría - Tarea B</h1>
      
      {/* Botón que abre el modal */}
      <button 
        onClick={() => setIsModalOpen(true)}
        style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }}
      >
        + Nuevo Paquete
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {paquetes.map(p => (
          <PaqueteCard key={p.id_paquete} paquete={p} onToggle={cargarPaquetes} />
        ))}
      </div>

      {/* Componente Modal */}
      <NuevoPaqueteModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={cargarPaquetes} 
      />
    </div>
  )
}

export default App