import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { apiClient } from '../../services/apiClient';
import { iniciarChat } from '../../services/chatService';

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

  const navigate = useNavigate();
  const location = useLocation();
  const { token: user } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('canceled') === 'true') {
      setToastMsg({ type: 'warn', text: 'Pago cancelado. Puedes intentarlo de nuevo.' });
      window.history.replaceState({}, '', '/mentee/marketplace');
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
      .catch((err) => console.error('Error cargando taxonomias:', err));
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

        const data = await apiClient(`/api/paquetes/buscar?${params.toString()}`, {
          method: 'GET',
          signal: controller.signal,
        });
        setPaquetes(data);
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchMarketplace, 400);
    return () => {
      clearTimeout(debounceTimer);
      controller.abort();
    };
  }, [q, precioMax, idHabilidad, nivelDominio]);

  const handleAdquirir = async (idPaquete) => {
    try {
      const res = await apiClient('/api/contratos/adquirir', {
        method: 'POST',
        body: { id_paquete: idPaquete },
      });

      if (res.url_pago) {
        window.location.href = res.url_pago;
      } else {
        navigate('/mentee/contratos');
      }
    } catch (err) {
      setToastMsg({ type: 'error', text: `Error: ${err.message}` });
    }
  };

  const handleContactar = async (idMentor) => {
    try {
      const res = await iniciarChat(idMentor, null);
      navigate('/chat', { state: { salaId: res.id_sala } });
    } catch (err) {
      setToastMsg({ type: 'error', text: `Error al iniciar chat: ${err.message}` });
    }
  };

  const handleAplicarBeca = async () => {
    if (!carta.trim()) return;
    setEnviandoBeca(true);
    try {
      await apiClient('/api/contratos/aplicar-beca', {
        method: 'POST',
        body: { id_paquete: modalBeca.id_paquete, carta_motivacion: carta }
      });
      setToastMsg({ type: 'success', text: 'Solicitud enviada al panel del juez.' });
      setModalBeca({ open: false, id_paquete: null });
      setCarta('');
    } catch (err) {
      setToastMsg({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setEnviandoBeca(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">

      {toastMsg && (
        <div
          role="alert"
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl transition-all ${
            toastMsg.type === 'error'
              ? 'bg-red-800 text-white border border-red-600'
              : 'bg-yellow-800 text-white border border-yellow-600'
          }`}
        >
          {toastMsg.text}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Escaparate de Mentores</h1>
        <p className="text-gray-400 mb-6">Encuentra al experto ideal filtrando por atributos clave.</p>

        {/* Banner de entorno de pruebas */}
        <div className="mb-6 bg-amber-950/40 border border-amber-700/50 rounded-xl p-4 flex items-start gap-3">
          <span className="text-amber-400 text-lg mt-0.5">⚠️</span>
          <div className="text-sm leading-relaxed">
            <p className="text-amber-300 font-semibold mb-1">Entorno de desarrollo — Pagos en modo prueba</p>
            <p className="text-amber-200/70">
              Para probar la compra, usa la tarjeta de prueba de Stripe:{' '}
              <code className="bg-amber-900/50 text-amber-200 px-2 py-0.5 rounded font-mono text-xs">4242 4242 4242 4242</code>.
              Fecha de expiración: cualquier fecha futura. CVC: cualquier número de 3 dígitos, y el correo cualquier correo.
            </p>
          </div>
        </div>

        <div className="bg-[#141414] border border-gray-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Buscar por titulo o nombre..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-600 transition-colors"
          />

          <input
            type="number"
            placeholder="Precio maximo (USD)"
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-600 transition-colors"
          />

          <select
            value={idHabilidad}
            onChange={(e) => setIdHabilidad(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-600 transition-colors"
          >
            <option value="">Todas las habilidades</option>
            {categorias.map(
              (cat) =>
                cat.habilidades?.length > 0 && (
                  <optgroup key={cat.id_categoria} label={cat.nombre_categoria}>
                    {cat.habilidades.map((hab) => (
                      <option key={hab.id_habilidad} value={hab.id_habilidad}>
                        {hab.nombre_habilidad}
                      </option>
                    ))}
                  </optgroup>
                )
            )}
          </select>

            <select
              value={nivelDominio}
              onChange={(e) => setNivelDominio(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-600 transition-colors"
            >
              <option value="">Todos los niveles</option>
              <option value="basico">Basico</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
              <option value="experto">Experto</option>
            </select>
        </div>
      </div>

      {error ? (
        <div className="bg-red-900/30 border border-red-500 text-red-200 p-4 rounded-lg">
          Excepcion capturada: {error}
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-600"></div>
        </div>
      ) : paquetes.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-700 rounded-2xl">
          <p className="text-gray-400">
            No se encontraron conjuntos de datos que coincidan con la métrica solicitada.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paquetes.map((p) => (
            <div
              key={p.id_paquete}
              className="bg-[#141414] border border-red-900/30 rounded-2xl p-6 flex flex-col justify-between hover:border-red-600/50 transition-colors shadow-lg"
            >
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-800">
                {p.mentor_foto ? (
                  <img
                    src={p.mentor_foto}
                    alt={p.mentor_nombre}
                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-700"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-xl border-2 border-gray-700">
                    {p.mentor_nombre.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white leading-tight">{p.mentor_nombre}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] text-green-400 font-bold tracking-wider uppercase border border-green-500/20 bg-green-500/5 px-1.5 py-0.5 rounded">
                      Verificado
                    </span>
                    <div className="flex items-center gap-0.5 text-yellow-500 font-bold text-xs">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>{p.calificacion_promedio ? `${p.calificacion_promedio}` : 'Nuevo'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6 flex-1">
                <h4 className="text-xl font-bold text-red-400 mb-2">{p.titulo_paquete}</h4>
                <div className="flex justify-between items-end mt-4">
                  <span className="text-gray-400 bg-[#0a0a0a] px-3 py-1 rounded-md text-sm border border-gray-800">
                    {p.cantidad_horas_totales} Horas
                  </span>
                  <span className="text-2xl font-bold text-white">${p.precio_total}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleContactar(p.id_mentor)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-md"
                >
                  Mensaje
                </button>
                {user ? (
                  <div className="flex flex-col gap-2 w-full">
                    <button
                      onClick={() => handleAdquirir(p.id_paquete)}
                      className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-red-900/20"
                    >
                      Adquirir
                    </button>
                    <button
                      onClick={() => { setModalBeca({ open: true, id_paquete: p.id_paquete }); setCarta(''); }}
                      className="w-full bg-transparent border border-blue-600 text-blue-400 hover:bg-blue-900/30 font-bold py-2 rounded-xl transition-all"
                    >
                      Solicitar Beca
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-md hover:shadow-red-900/20"
                  >
                    Inicia sesion para agendar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {modalBeca.open && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-[#141414] border border-gray-800 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Solicitud de Beca</h3>
            <p className="text-xs text-gray-500 mb-4">Escribe tus motivos. Convence al mentor.</p>
            <textarea 
              rows="5"
              value={carta}
              onChange={(e) => setCarta(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-gray-800 text-white rounded-xl p-3 focus:border-blue-500 outline-none resize-none transition-colors mb-4"
              placeholder="Soy estudiante y admiro tu trabajo..."
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setModalBeca({ open: false, id_paquete: null })} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
              <button onClick={handleAplicarBeca} disabled={enviandoBeca || !carta.trim()} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-2 rounded-xl disabled:opacity-50">
                {enviandoBeca ? 'Enviando...' : 'Enviar Súplica'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}