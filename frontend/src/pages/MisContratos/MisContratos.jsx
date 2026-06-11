import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { FileText, Star, CircleCheck as CheckCircle, Clock, Package, Calendar, X } from 'lucide-react';

export default function MisContratos() {
  const [contratos, setContratos] = useState([]);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [modalResena, setModalResena] = useState({ open: false, id_contrato: null });
  const [estrellas, setEstrellas] = useState(5);
  const [comentario, setComentario] = useState('');
  const [contratosResenados, setContratosResenados] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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
      .then(setContratos)
      .catch(err => {
        if (err.status === 403) navigate('/mentee/completar-perfil');
        else setError(err.message);
      });
  }, [navigate]);

  const estadoConfig = {
    activo: { label: 'Activo', class: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
    pendiente_pago: { label: 'Pendiente', class: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
    completado: { label: 'Completado', class: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    cancelado: { label: 'Cancelado', class: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-400' },
  };

  const enviarResena = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await apiClient(`/api/contratos/${modalResena.id_contrato}/resenas`, {
        method: 'POST',
        body: { calificacion_estrellas: estrellas, comentario_texto: comentario || null }
      });
      setContratosResenados(prev => new Set(prev).add(modalResena.id_contrato));
      setSuccessMsg('¡Gracias por tu reseña!');
      setModalResena({ open: false, id_contrato: null });
    } catch (e) {
      if (e.message.includes('409') || e.message.toLowerCase().includes('ya existe')) {
        setContratosResenados(prev => new Set(prev).add(modalResena.id_contrato));
        setModalResena({ open: false, id_contrato: null });
      } else {
        alert('Error al publicar la reseña: ' + e.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const reintentarPago = async (id_contrato) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const data = await apiClient(`/api/contratos/${id_contrato}/pagar`, { method: 'POST' });
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert('El servidor no devolvió una URL de pago.');
      }
    } catch (e) {
      alert('Error al iniciar pago: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = {
    total: contratos.length,
    activos: contratos.filter(c => c.estado === 'activo').length,
    completados: contratos.filter(c => c.estado === 'completado').length,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8 animate-in">
        <h1 className="text-2xl font-bold text-slate-900">Mis Contratos</h1>
        <p className="text-slate-500 mt-1">Historial de paquetes adquiridos y sesiones.</p>
      </div>

      {/* Stats row */}
      {contratos.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8 animate-in" style={{ animationDelay: '40ms' }}>
          {[
            { label: 'Total', value: stats.total, icon: Package, color: 'text-slate-600 bg-slate-50', border: 'border-slate-200' },
            { label: 'Activos', value: stats.activos, icon: Clock, color: 'text-green-600 bg-green-50', border: 'border-green-100' },
            { label: 'Completados', value: stats.completados, icon: CheckCircle, color: 'text-blue-600 bg-blue-50', border: 'border-blue-100' },
          ].map(({ label, value, icon: Icon, color, border }) => (
            <div key={label} className={`bg-white rounded-2xl border ${border} p-4 flex items-center gap-3 shadow-sm`}>
              <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                <Icon size={16} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alerts */}
      {successMsg && (
        <div className="toast-enter mb-5 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2.5 text-sm text-green-700">
          <CheckCircle size={15} />
          {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 animate-in">{error}</div>
      )}

      {contratos.length === 0 && !error ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm animate-in">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-slate-300" />
          </div>
          <p className="text-slate-700 font-semibold">No tienes contratos aún.</p>
          <p className="text-slate-400 text-sm mt-1">Explora el catálogo para adquirir tu primer paquete.</p>
          <Link to="/catalog" className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
            Explorar mentores
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {contratos.map((c, i) => {
            const estado = estadoConfig[c.estado] || { label: c.estado, class: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
            const puedeResenar = (c.estado === 'activo' || c.estado === 'completado') && !c.ya_resenado && !contratosResenados.has(c.id_contrato);
            const horasReal = c.cantidad_horas_totales || c.horas_totales;
            const horasTotal = horasReal > 0 ? horasReal : null;
            const horasUsadas = c.horas_consumidas || 0;
            const progreso = horasTotal ? Math.min(100, Math.round((horasUsadas / horasTotal) * 100)) : 0;

            return (
              <div
                key={c.id_contrato}
                className="slide-up bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all p-5"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Package size={16} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{c.paquete}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock size={11} />{horasUsadas} / {horasTotal || '?'}h usadas
                        </p>
                        {c.proximo_sesion && (
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar size={11} />{new Date(c.proximo_sesion).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {puedeResenar && (
                      <button
                        onClick={() => { setModalResena({ open: true, id_contrato: c.id_contrato }); setEstrellas(5); setComentario(''); }}
                        className="flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 transition-all"
                      >
                        <Star size={12} />Calificar
                      </button>
                    )}
                    {c.estado === 'pendiente_pago' && (
                      <button
                        onClick={() => reintentarPago(c.id_contrato)}
                        disabled={isSubmitting}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                      >
                        Reintentar pago
                      </button>
                    )}
                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${estado.class}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${estado.dot}`} />
                      {estado.label}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500">Progreso</span>
                    <span className="text-xs font-semibold text-slate-700">{progreso}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        progreso >= 100 ? 'bg-blue-500' : progreso > 50 ? 'bg-primary-500' : 'bg-primary-400'
                      }`}
                      style={{ width: `${progreso}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review modal */}
      {modalResena.open && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 px-4 fade-in">
          <div className="modal-pop bg-white rounded-2xl shadow-xl border border-slate-100 p-6 w-full max-w-sm">
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-lg font-bold text-slate-900">Califica al Mentor</h3>
              <button onClick={() => setModalResena({ open: false, id_contrato: null })} className="text-slate-400 hover:text-slate-700 transition-colors p-1">
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-5">Tu opinión ayuda a mantener la calidad.</p>

            <div className="mb-5">
              <label className="block text-xs font-medium text-slate-600 mb-2">Calificación</label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(s => (
                  <button
                    key={s}
                    onClick={() => setEstrellas(s)}
                    className={`text-3xl transition-all duration-100 hover:scale-110 active:scale-95 ${s <= estrellas ? 'text-amber-400' : 'text-slate-200'}`}
                  >★</button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-slate-600 mb-2">Comentario (opcional)</label>
              <textarea
                rows="3"
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 resize-none transition-all placeholder:text-slate-400"
                placeholder="¿Cómo te ayudó el mentor?"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setModalResena({ open: false, id_contrato: null })} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
              <button
                onClick={enviarResena}
                disabled={isSubmitting}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all shadow-sm"
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
