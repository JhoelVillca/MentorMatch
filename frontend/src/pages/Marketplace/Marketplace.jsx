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

  // --- LÓGICA DE NEGOCIO (INTACTA) ---

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
      .catch((err) => console.error('Error cargando taxonomías:', err));
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
    /* Contenedor con degradado que emula el estilo de 'image_503377.jpg' */
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-['Poppins'] bg-gradient-to-br from-indigo-950 via-purple-950 to-black bg-fixed">
      
      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl backdrop-blur-md border ${toastMsg.type === 'error' ? 'bg-red-900/80 border-red-500' : 'bg-yellow-900/80 border-yellow-500'}`}>
          {toastMsg.text}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Escaparate de Mentores</h1>
        <p className="text-slate-400 mb-8 text-base max-w-xl">
          Encuentra al experto ideal filtrando por atributos clave en un entorno moderno y eficiente.
        </p>

        {/* Banner de Entorno */}
        <div className="mb-8 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex items-start gap-4 shadow-xl">
          <span className="text-amber-400 text-3xl">⚠️</span>
          <div>
            <p className="font-bold text-amber-400">Entorno de desarrollo — Pagos en modo prueba</p>
            <p className="text-slate-400 text-sm">
              Para probar la compra, usa la tarjeta de prueba: <code>4242 4242 4242 4242</code>.
            </p>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          <input 
            type="text" 
            placeholder="Buscar por titulo o nombre..." 
            value={q} 
            onChange={(e) => setQ(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none" 
          />
          
          <input 
            type="number" 
            placeholder="Precio maximo (USD)" 
            value={precioMax} 
            onChange={(e) => setPrecioMax(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none" 
          />

          <select 
            value={idHabilidad} 
            onChange={(e) => setIdHabilidad(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
          >
            <option value="" className="bg-black">Todas las habilidades</option>
            {categorias.map((cat) => cat.habilidades?.length > 0 && (
              <optgroup key={cat.id_categoria} label={cat.nombre_categoria} className="bg-black text-white">
                {cat.habilidades.map((hab) => (
                  <option key={hab.id_habilidad} value={hab.id_habilidad} className="bg-black">{hab.nombre_habilidad}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Grid de Contenido */}
        {error ? (
          <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-2xl text-center">Error: {error}</div>
        ) : loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div></div>
        ) : paquetes.length === 0 ? (
          <div className="text-center py-20 border border-white/10 rounded-2xl bg-black/30 backdrop-blur-sm">
             <p className="text-slate-400">No se encontraron mentores.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paquetes.map((p) => (
              <div key={p.id_paquete} className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 flex flex-col justify-between hover:border-purple-500/50 transition-all">
                <div className="flex items-center gap-5 pb-6 border-b border-white/10">
                  {p.mentor_foto ? <img src={p.mentor_foto} alt={p.mentor_nombre} className="w-16 h-16 rounded-full object-cover" /> 
                    : <div className="w-16 h-16 rounded-full bg-purple-900 flex items-center justify-center font-bold text-2xl">{p.mentor_nombre.charAt(0)}</div>}
                  <h3 className="text-xl font-bold">{p.mentor_nombre}</h3>
                </div>
                <div className="mb-6 mt-4">
                  <h4 className="text-2xl font-bold text-purple-400 mb-4">{p.titulo_paquete}</h4>
                  <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5">
                    <span className="text-slate-400 text-sm">{p.cantidad_horas_totales} Horas</span>
                    <span className="text-2xl font-bold">${p.precio_total}</span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => handleContactar(p.id_mentor)} className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl transition-all text-sm font-bold">Mensaje</button>
                  <button onClick={() => handleAdquirir(p.id_paquete)} className="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded-xl transition-all text-sm font-bold">Adquirir</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}