import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const [toastMsg, setToastMsg] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

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
  }, [q, precioMax, idHabilidad]);

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

        <div className="bg-[#141414] border border-gray-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <span className="text-xs text-green-400 font-medium tracking-wide uppercase">
                    Operador Verificado
                  </span>
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
                <button
                  onClick={() => handleAdquirir(p.id_paquete)}
                  className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-md hover:shadow-red-900/20"
                >
                  Adquirir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}