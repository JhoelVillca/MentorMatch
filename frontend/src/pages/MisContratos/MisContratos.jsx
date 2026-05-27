import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';

export default function MisContratos() {
  const [contratos, setContratos] = useState([]);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // --- ESTADOS PARA EL SISTEMA DE RESEÑAS ---
  const [modalResena, setModalResena] = useState({ open: false, id_contrato: null });
  const [estrellas, setEstrellas] = useState(5);
  const [comentario, setComentario] = useState('');
  const [contratosResenados, setContratosResenados] = useState(new Set()); // UI Optimista
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevención Double-Click

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success') === 'true') {
      setSuccessMsg('Pago procesado. Tu contrato estará activo en segundos.');
      window.history.replaceState({}, '', '/mentee/contratos');
    }
  }, [location.search]);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 5000);
    return () => clearTimeout(t);
  }, [successMsg]);

  useEffect(() => {
    apiClient('/api/contratos/me', { method: 'GET' })
      .then((data) => setContratos(data))
      .catch((err) => setError(err.message));
  }, []);

  const estadoColor = (estado) => {
    switch (estado) {
      case 'activo': return 'text-green-400';
      case 'pendiente_pago': return 'text-yellow-400';
      case 'completado': return 'text-blue-400';
      case 'cancelado': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // --- LÓGICA DE RESEÑAS ---
  const abrirModal = (id_contrato) => {
    setModalResena({ open: true, id_contrato });
    setEstrellas(5);
    setComentario('');
  };

  const cerrarModal = () => {
    setModalResena({ open: false, id_contrato: null });
  };

  const enviarResena = async () => {
    if (isSubmitting) return; // Bloqueo anti-spam
    setIsSubmitting(true);

    try {
      await apiClient(`/api/contratos/${modalResena.id_contrato}/resenas`, {
        method: 'POST',
        body: { calificacion_estrellas: estrellas, comentario_texto: comentario || null }
      });
      
      // UI Optimista: Registramos localmente que ya se reseñó para ocultar el botón
      setContratosResenados((prev) => new Set(prev).add(modalResena.id_contrato));
      setSuccessMsg('¡Gracias por calificar a tu mentor!');
      cerrarModal();
    } catch (e) {
      // Manejo del 409 Conflict o IntegrityError
      if (e.message.includes('409') || e.message.toLowerCase().includes('ya existe')) {
        alert('Ya habías dejado una reseña para este contrato.');
        setContratosResenados((prev) => new Set(prev).add(modalResena.id_contrato));
        cerrarModal();
      } else {
        alert('Error al publicar la reseña: ' + e.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 text-white max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mis Contratos</h1>

      {successMsg && (
        <div className="mb-6 bg-green-900/30 border border-green-600/50 rounded-xl p-4 text-green-300 text-sm font-semibold">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-900/30 border border-red-600/50 rounded-xl p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {contratos.length === 0 && !error ? (
        <div className="text-center py-12 border border-dashed border-gray-700 rounded-2xl">
          <p className="text-gray-400">No tienes contratos aún.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {contratos.map((c) => (
            <li
              key={c.id_contrato}
              // Modificado a flex-col en móviles para que el botón entre bien
              className="bg-[#141414] border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div className="flex-1">
                <p className="font-semibold text-white">{c.paquete}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Horas usadas: {c.horas_consumidas}
                </p>
              </div>
              
              <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                <span className={`text-sm font-bold uppercase ${estadoColor(c.estado)}`}>
                  {c.estado.replace('_', ' ')}
                </span>
                
                {/* BOTÓN "DEJAR RESEÑA" */}
                {(c.estado === 'activo' || c.estado === 'completado') && !c.ya_resenado && !contratosResenados.has(c.id_contrato) && (
                  <button 
                    onClick={() => abrirModal(c.id_contrato)}
                    className="text-xs font-bold border border-yellow-600/50 text-yellow-500 px-3 py-1.5 rounded-lg hover:bg-yellow-900/30 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Dejar Reseña
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* MODAL OVERLAY */}
      {modalResena.open && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-[#141414] border border-gray-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1">Califica al Mentor</h3>
            <p className="text-xs text-gray-500 mb-5">Tu opinión ayuda a mantener la calidad de MentorMatch.</p>
            
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-400 mb-2">Estrellas (1-5)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setEstrellas(star)}
                    className={`text-3xl transition-transform hover:scale-110 focus:outline-none ${
                      star <= estrellas ? 'text-yellow-500' : 'text-gray-700'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-400 mb-2">Comentario (opcional)</label>
              <textarea 
                rows="3"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-gray-800 text-white rounded-xl p-3 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none resize-none transition-colors"
                placeholder="¿Cómo te ayudó el mentor?"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={cerrarModal}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={enviarResena}
                disabled={isSubmitting}
                className="bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-bold px-5 py-2 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}