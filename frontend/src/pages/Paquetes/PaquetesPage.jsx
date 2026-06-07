import { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { Plus, Package, ToggleLeft, ToggleRight, Pencil, CircleCheck as CheckCircle, Circle as XCircle, Clock, X, DollarSign, Hash } from 'lucide-react';

const PaquetesPage = () => {
  const [paquetes, setPaquetes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ titulo_paquete: '', cantidad_horas_totales: '', precio_total: '' });

  const fetchPaquetes = async () => {
    try {
      const data = await apiClient('/api/paquetes/me', { method: 'GET' });
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
        await apiClient(`/api/paquetes/${editId}`, { method: 'PATCH', body: payload });
      } else {
        await apiClient('/api/paquetes/', { method: 'POST', body: payload });
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
    setErrorMessage('');
  };

  const handleToggleStatus = async (id, estadoActual) => {
    try {
      await apiClient(`/api/paquetes/${id}/status`, { method: 'PATCH', body: { estado_activo: !estadoActual } });
      fetchPaquetes();
    } catch (error) {
      setErrorMessage(error?.message || 'No se pudo actualizar.');
    }
  };

  const validacionConfig = {
    aprobado: { label: 'Aprobado', icon: CheckCircle, class: 'text-green-700 bg-green-50 border-green-200' },
    rechazado: { label: 'Rechazado', icon: XCircle, class: 'text-red-700 bg-red-50 border-red-200' },
    pendiente: { label: 'En revisión', icon: Clock, class: 'text-amber-700 bg-amber-50 border-amber-200' },
  };

  const inputClass = 'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all placeholder:text-slate-400';

  const activeCount = paquetes.filter(p => p.estado_activo).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis Paquetes</h1>
          <p className="text-slate-500 mt-1">
            Gestiona tu oferta de mentoría.
            {paquetes.length > 0 && (
              <span className="ml-2 text-xs text-slate-400">{activeCount}/{paquetes.length} activos</span>
            )}
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-primary-600/20 transition-all active:scale-95"
        >
          <Plus size={16} />Nuevo paquete
        </button>
      </div>

      {errorMessage && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 animate-in">{errorMessage}</div>
      )}

      {paquetes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm animate-in">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-slate-300" />
          </div>
          <p className="text-slate-700 font-semibold">Sin paquetes creados aún.</p>
          <p className="text-slate-400 text-sm mt-1">Crea tu primer paquete para comenzar a enseñar.</p>
          <button
            onClick={handleOpenNew}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
          >
            <Plus size={15} />Crear mi primer paquete
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paquetes.map((p, i) => {
            const val = validacionConfig[p.estado_validacion] || validacionConfig.pendiente;
            const ValIcon = val.icon;
            return (
              <div
                key={p.id_paquete}
                className={`animate-in bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group ${
                  p.estado_activo ? 'border-slate-100 hover:border-slate-200' : 'border-slate-100 opacity-75 hover:opacity-90'
                }`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Top color accent strip */}
                <div className={`h-1 w-full ${
                  p.estado_validacion === 'aprobado'
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                    : p.estado_validacion === 'rechazado'
                    ? 'bg-gradient-to-r from-red-400 to-red-500'
                    : 'bg-gradient-to-r from-amber-300 to-amber-400'
                }`} />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-semibold text-slate-900 leading-tight flex-1 mr-2">{p.titulo_paquete}</h3>
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${p.estado_activo ? 'bg-green-500 shadow-sm shadow-green-300' : 'bg-slate-300'}`} title={p.estado_activo ? 'Activo' : 'Inactivo'} />
                  </div>

                  <div className="flex items-center gap-2 mb-5">
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border ${val.class}`}>
                      <ValIcon size={11} />{val.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Hash size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-500">Horas</span>
                      </div>
                      <p className="text-lg font-bold text-slate-900">{p.cantidad_horas_totales}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <DollarSign size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-500">Precio</span>
                      </div>
                      <p className="text-lg font-bold text-slate-900">${p.precio_total}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleStatus(p.id_paquete, p.estado_activo)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all active:scale-95 ${
                        p.estado_activo
                          ? 'border-green-200 text-green-700 hover:bg-green-50'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p.estado_activo
                        ? <><ToggleRight size={14} className="text-green-600" />Desactivar</>
                        : <><ToggleLeft size={14} />Activar</>
                      }
                    </button>
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-all active:scale-95"
                    >
                      <Pencil size={12} />Editar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 fade-in">
          <div className="modal-pop bg-white rounded-2xl shadow-xl border border-slate-100 p-7 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{editId ? 'Editar paquete' : 'Nuevo paquete'}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{editId ? 'Modifica los detalles de tu paquete.' : 'Define tu oferta de mentoría.'}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 hover:bg-slate-50 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Título del paquete</label>
                <input
                  type="text"
                  placeholder="Ej: Mentoría en React Avanzado"
                  required
                  value={formData.titulo_paquete}
                  onChange={e => setFormData({...formData, titulo_paquete: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Horas totales</label>
                  <div className="relative">
                    <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      placeholder="10"
                      required
                      min="1"
                      value={formData.cantidad_horas_totales}
                      onChange={e => setFormData({...formData, cantidad_horas_totales: e.target.value})}
                      className={inputClass + ' pl-9'}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Precio (USD)</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="150"
                      required
                      min="0"
                      value={formData.precio_total}
                      onChange={e => setFormData({...formData, precio_total: e.target.value})}
                      className={inputClass + ' pl-9'}
                    />
                  </div>
                </div>
              </div>
              {errorMessage && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{errorMessage}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-all shadow-sm active:scale-[0.98]">
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
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
