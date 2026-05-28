import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';

export default function MisContratos() {
  const [contratos, setContratos] = useState([]);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  // Estados de reseña
  const [modalResena, setModalResena] = useState({ open: false, id_contrato: null });
  const [estrellas, setEstrellas] = useState(5);
  const [comentario, setComentario] = useState('');
  const [contratosResenados, setContratosResenados] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success') === 'true') {
      setSuccessMsg('Pago procesado. Tu contrato estará activo en segundos.');
      window.history.replaceState({}, '', '/mentee/contratos');
    }
  }, [location.search]);

  useEffect(() => {
    apiClient('/api/contratos/me', { method: 'GET' })
      .then((data) => setContratos(data))
      .catch((err) => setError(err.message));
  }, []);

  // Función mejorada para estilos de estado (Pills)
  const getEstadoStyles = (estado) => {
    switch (estado) {
      case 'activo': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'pendiente_pago': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'completado': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'cancelado': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const abrirModal = (id_contrato) => { setModalResena({ open: true, id_contrato }); setEstrellas(5); setComentario(''); };
  const cerrarModal = () => setModalResena({ open: false, id_contrato: null });

  const enviarResena = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await apiClient(`/api/contratos/${modalResena.id_contrato}/resenas`, {
        method: 'POST',
        body: { calificacion_estrellas: estrellas, comentario_texto: comentario || null }
      });
      setContratosResenados((prev) => new Set(prev).add(modalResena.id_contrato));
      setSuccessMsg('¡Gracias por calificar a tu mentor!');
      cerrarModal();
    } catch (e) {
      alert('Error al publicar la reseña: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 text-white max-w-3xl mx-auto min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-white">Mis Contratos</h1>

      {/* Notificaciones */}
      {successMsg && <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-green-400 text-sm">{successMsg}</div>}
      {error && <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm">{error}</div>}

      {/* Lista de Contratos */}
      {contratos.length === 0 && !error ? (
        <div className="text-center py-20 border border-dashed border-gray-800 rounded-3xl bg-[#141414]/50">
          <p className="text-gray-500">Aún no tienes contratos activos.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {contratos.map((c) => (
            <li key={c.id_contrato} className="group bg-[#141414] hover:bg-[#1a1a1a] border border-gray-800 hover:border-gray-700 rounded-2xl p-6 transition-all duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-lg text-white">{c.paquete}</h3>
                <p className="text-sm text-gray-400 mt-1">Horas consumidas: <span className="font-mono text-gray-200">{c.horas_consumidas}</span></p>
              </div>
              
              <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getEstadoStyles(c.estado)}`}>
                  {c.estado.replace('_', ' ')}
                </span>
                
                {(c.estado === 'activo' || c.estado === 'completado') && !c.ya_resenado && !contratosResenados.has(c.id_contrato) && (
                  <button onClick={() => abrirModal(c.id_contrato)} className="text-xs font-bold bg-yellow-600/10 hover:bg-yellow-600/20 text-yellow-500 border border-yellow-600/30 px-4 py-2 rounded-xl transition-all flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    Dejar Reseña
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal Overlay Mejorado */}
      {modalResena.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-gray-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-bold text-white mb-1">Califica al Mentor</h3>
            <p className="text-sm text-gray-500 mb-6">Tu opinión es fundamental.</p>
            
            <div className="mb-6 flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setEstrellas(star)} className={`text-4xl transition-all ${star <= estrellas ? 'text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'text-gray-800 hover:text-gray-600'}`}>★</button>
              ))}
            </div>

            <textarea 
              value={comentario} onChange={(e) => setComentario(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-gray-800 text-white rounded-xl p-4 focus:border-yellow-600 outline-none resize-none mb-6 text-sm"
              placeholder="¿Qué tal fue la mentoría?" rows="3"
            />

            <div className="flex gap-3">
              <button onClick={cerrarModal} className="flex-1 px-4 py-3 text-sm font-semibold text-gray-500 hover:text-white transition-colors">Cancelar</button>
              <button onClick={enviarResena} disabled={isSubmitting} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-4 py-3 rounded-xl transition-all">
                {isSubmitting ? 'Enviando...' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}