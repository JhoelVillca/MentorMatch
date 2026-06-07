import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { apiClient } from '../../services/apiClient';
import { iniciarChat } from '../../services/chatService';
import { Search, ListFilter as Filter, Star, MessageSquare, ShoppingCart, GraduationCap, CircleAlert as AlertCircle, X, SlidersHorizontal } from 'lucide-react';

export default function Marketplace() {
  const [paquetes, setPaquetes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [idHabilidad, setIdHabilidad] = useState('');
  const [nivelDominio, setNivelDominio] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  const [modalBeca, setModalBeca] = useState({ open: false, id_paquete: null });
  const [carta, setCarta] = useState('');
  const [enviandoBeca, setEnviandoBeca] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const { token: user } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('canceled') === 'true') {
      setToastMsg({ type: 'warn', text: 'Pago cancelado. Puedes intentarlo de nuevo.' });
      window.history.replaceState({}, '', '/catalog');
    }
  }, [location.search]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 4000);
    return () => clearTimeout(t);
  }, [toastMsg]);

  useEffect(() => {
    apiClient('/api/skills/categories', { method: 'GET' })
      .then(setCategorias)
      .catch(console.error);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchMarketplace = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (q) params.append('q', q);
        if (precioMax) params.append('precio_max', precioMax);
        if (idHabilidad) params.append('id_habilidad', idHabilidad);
        if (nivelDominio) params.append('nivel_dominio', nivelDominio);
        const data = await apiClient(`/api/paquetes/buscar?${params.toString()}`, { method: 'GET', signal: controller.signal });
        setPaquetes(data);
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(fetchMarketplace, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [q, precioMax, idHabilidad, nivelDominio]);

  const handleAdquirir = async (idPaquete) => {
    try {
      const res = await apiClient('/api/contratos/adquirir', { method: 'POST', body: { id_paquete: idPaquete } });
      if (res.url_pago) window.location.href = res.url_pago;
      else navigate('/mentee/contratos');
    } catch (err) {
      setToastMsg({ type: 'error', text: err.message });
    }
  };

  const handleContactar = async (idMentor) => {
    try {
      const res = await iniciarChat(idMentor, null);
      navigate('/chat', { state: { salaId: res.id_sala } });
    } catch (err) {
      setToastMsg({ type: 'error', text: err.message });
    }
  };

  const handleAplicarBeca = async () => {
    if (!carta.trim()) return;
    setEnviandoBeca(true);
    try {
      await apiClient('/api/contratos/aplicar-beca', { method: 'POST', body: { id_paquete: modalBeca.id_paquete, carta_motivacion: carta } });
      setToastMsg({ type: 'success', text: 'Solicitud enviada.' });
      setModalBeca({ open: false, id_paquete: null });
      setCarta('');
    } catch (err) {
      setToastMsg({ type: 'error', text: err.message });
    } finally {
      setEnviandoBeca(false);
    }
  };

  const hasFilters = q || precioMax || idHabilidad || nivelDominio;

  const selectClass = 'w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Toast */}
      {toastMsg && (
        <div className={`toast-enter fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg border flex items-center gap-2.5 ${
          toastMsg.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {toastMsg.text}
          <button onClick={() => setToastMsg(null)} className="ml-1 text-current/50 hover:text-current transition-colors">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 animate-in">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Catálogo de Mentores</h1>
            <p className="text-slate-500 mt-1">Encuentra al experto ideal para tu crecimiento profesional.</p>
          </div>
          {paquetes.length > 0 && (
            <span className="hidden sm:block text-xs text-slate-500 bg-white border border-slate-100 rounded-full px-3 py-1.5 shadow-sm font-medium">
              {paquetes.length} mentores
            </span>
          )}
        </div>
      </div>

      {/* Dev notice */}
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 animate-in" style={{ animationDelay: '40ms' }}>
        <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-amber-800 mb-0.5">Pagos en modo prueba</p>
          <p className="text-amber-700 text-xs">
            Usa la tarjeta{' '}
            <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">4242 4242 4242 4242</code>
            {' '}con cualquier fecha futura y CVC.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-8 overflow-hidden animate-in" style={{ animationDelay: '80ms' }}>
        <button
          onClick={() => setFiltersVisible(!filtersVisible)}
          className="w-full flex items-center gap-2 px-5 py-4 hover:bg-slate-50 transition-colors"
        >
          <SlidersHorizontal size={15} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-700">Filtros</span>
          {hasFilters && (
            <span className="ml-1 w-1.5 h-1.5 rounded-full bg-primary-500" />
          )}
          <span className={`ml-auto text-slate-400 transition-transform duration-200 ${filtersVisible ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </button>

        <div className={`overflow-hidden transition-all duration-300 ${filtersVisible ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 border-t border-slate-50">
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Buscar por título o nombre..."
                value={q}
                onChange={e => setQ(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all placeholder:text-slate-400"
              />
            </div>
            <input
              type="number"
              placeholder="Precio máximo (USD)"
              value={precioMax}
              onChange={e => setPrecioMax(e.target.value)}
              className={selectClass + ' mt-3'}
            />
            <select value={idHabilidad} onChange={e => setIdHabilidad(e.target.value)} className={selectClass + ' mt-3'}>
              <option value="">Todas las habilidades</option>
              {categorias.map(cat => cat.habilidades?.length > 0 && (
                <optgroup key={cat.id_categoria} label={cat.nombre_categoria}>
                  {cat.habilidades.map(hab => (
                    <option key={hab.id_habilidad} value={hab.id_habilidad}>{hab.nombre_habilidad}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <select value={nivelDominio} onChange={e => setNivelDominio(e.target.value)} className={selectClass + ' mt-3'}>
              <option value="">Todos los niveles</option>
              <option value="basico">Básico</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
              <option value="experto">Experto</option>
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 animate-in">Error: {error}</div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden h-64 animate-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="shimmer h-full w-full" />
            </div>
          ))}
        </div>
      ) : paquetes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 animate-in">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={28} className="text-slate-300" />
          </div>
          <p className="text-slate-700 font-semibold">No se encontraron mentores</p>
          <p className="text-slate-400 text-sm mt-1">Intenta ajustar los filtros de búsqueda.</p>
          {hasFilters && (
            <button
              onClick={() => { setQ(''); setPrecioMax(''); setIdHabilidad(''); setNivelDominio(''); }}
              className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paquetes.map((p, i) => (
            <div
              key={p.id_paquete}
              className="animate-in bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden group"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Mentor header */}
              <div
                onClick={() => navigate(`/mentor/perfil/${p.id_mentor}`)}
                className="flex items-center gap-3 p-5 border-b border-slate-50 cursor-pointer hover:bg-slate-50/70 transition-colors"
              >
                {p.mentor_foto ? (
                  <img src={p.mentor_foto} alt={p.mentor_nombre} className="w-11 h-11 rounded-full object-cover border-2 border-slate-100 ring-2 ring-white" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-200 to-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm border-2 border-primary-50 ring-2 ring-white">
                    {p.mentor_nombre.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-primary-700 transition-colors">{p.mentor_nombre}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-green-700 font-semibold bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">Verificado</span>
                    {p.calificacion_promedio && (
                      <div className="flex items-center gap-0.5 text-amber-500 text-xs font-semibold">
                        <Star size={11} className="fill-current" />
                        {p.calificacion_promedio}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-base font-semibold text-slate-900 mb-3 leading-snug">{p.titulo_paquete}</h3>

                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                    <Star size={11} className="text-slate-400" />
                    {p.cantidad_horas_totales} {p.cantidad_horas_totales === 1 ? 'hora' : 'horas'}
                  </div>
                  <div>
                    <span className="text-xl font-bold text-slate-900">${p.precio_total}</span>
                    <span className="text-xs text-slate-400 ml-1">USD</span>
                  </div>
                </div>

                <div className="mt-auto space-y-2">
                  <button
                    onClick={() => handleContactar(p.id_mentor)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 text-sm font-medium rounded-xl transition-all"
                  >
                    <MessageSquare size={14} />Mensaje
                  </button>
                  {user ? (
                    <>
                      <button
                        onClick={() => handleAdquirir(p.id_paquete)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-primary-600/20 active:scale-[0.98]"
                      >
                        <ShoppingCart size={14} />Adquirir
                      </button>
                      <button
                        onClick={() => { setModalBeca({ open: true, id_paquete: p.id_paquete }); setCarta(''); }}
                        className="w-full py-2 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl transition-all"
                      >
                        Solicitar beca
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-primary-600/20"
                    >
                      Inicia sesión para adquirir
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scholarship modal */}
      {modalBeca.open && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 px-4 fade-in">
          <div className="modal-pop bg-white rounded-2xl shadow-xl border border-slate-100 p-6 w-full max-w-md">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Solicitud de Beca</h3>
                <p className="text-sm text-slate-500 mt-0.5">Escribe tus motivos para recibir este paquete gratuitamente.</p>
              </div>
              <button onClick={() => setModalBeca({ open: false, id_paquete: null })} className="text-slate-400 hover:text-slate-700 transition-colors p-1">
                <X size={18} />
              </button>
            </div>
            <textarea
              rows="5"
              value={carta}
              onChange={e => setCarta(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 resize-none transition-all mb-4 placeholder:text-slate-400"
              placeholder="Soy estudiante y..."
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setModalBeca({ open: false, id_paquete: null })} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
              <button
                onClick={handleAplicarBeca}
                disabled={enviandoBeca || !carta.trim()}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all shadow-sm"
              >
                {enviandoBeca ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
