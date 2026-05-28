import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { iniciarChat } from '../../services/chatService';

// TÍTULO DEL DOCUMENTO: Marketplace del Alumno (Versión Premium con Glassmorphism)
// PROPÓSITO: Actualizar el escaparate de mentores con una estética más premium, limpia, adaptativa y alegre.
// ALCANCE: Mejora visual de layout, tarjetas, filtros, badges y botones, con integración de efecto "glassmorphism" y un fondo alegre abstracto.
// REQUISITOS NO FUNCIONALES: Interfaz intuitiva, accesible, diseño adaptativo, adaptado a modo oscuro, y fondo alegre abstracto.
// RESTRICCIONES: No afectar la funcionalidad existente (states, useEffect, handleSubmit, etc.).

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
    // 🌪️ Fondo Alegre Abstracto (Capa de imagen y overlay)
    <div className="min-h-screen bg-slate-50 dark:bg-plomo-darkCanvas p-6 md:p-12 font-['Poppins'] transition-colors duration-500 relative overflow-hidden" 
         style={{backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')"}}>
      
      {/* 🔹 Capa de Glassmorphism para el fondo completo, suavizando la imagen */}
      <div className="absolute inset-0 bg-white/20 dark:bg-plomo-darkCanvas/40 backdrop-blur-xl transition-colors"></div>

      {/* 🔹 Toast Adaptativo y Premium */}
      {toastMsg && (
        <div
          role="alert"
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl backdrop-blur-md border transition-all ${
            toastMsg.type === 'error'
              ? 'bg-red-900/80 text-white border-red-500'
              : 'bg-yellow-900/80 text-white border-yellow-500'
          }`}
        >
          {toastMsg.text}
        </div>
      )}

      {/* 🔹 Sección de Cabecera y Filtros (Panel de Control) */}
      <div className="relative z-10 max-w-7xl mx-auto mb-10">
        <h1 className="text-4xl font-extrabold text-plomo-900 dark:text-white mb-2 drop-shadow-sm tracking-tight text-center md:text-left">
          Escaparate de Mentores
        </h1>
        <p className="text-slate-700 dark:text-slate-300 mb-8 text-center md:text-left text-base max-w-xl mx-auto md:mx-0">
          Encuentra al experto ideal filtrando por atributos clave en un entorno moderno y eficiente.
        </p>

        {/* 🔹 Banner de entorno de pruebas adaptado (Glass) */}
        <div className="mb-8 bg-amber-950/30 backdrop-blur-sm border border-amber-700/50 rounded-2xl p-6 flex items-start gap-4">
          <span className="text-amber-400 text-3xl mt-0.5">⚠️</span>
          <div className="text-sm leading-relaxed text-amber-100/90">
            <p className="text-amber-300 font-extrabold text-base mb-1.5 tracking-tight">Entorno de desarrollo — Pagos en modo prueba</p>
            <p className="text-amber-200/70">
              Para probar la compra, usa la tarjeta de prueba de Stripe:{' '}
              <code className="bg-amber-900/50 text-amber-200 px-2 py-0.5 rounded-md font-mono text-xs border border-amber-900">4242 4242 4242 4242</code>.
              Fecha de expiración: cualquier fecha futura. CVC: cualquier número de 3 dígitos, y el correo cualquier correo.
            </p>
          </div>
        </div>

        {/* 🔹 Barra de Filtros (Glass) */}
        <div className="bg-white/50 dark:bg-plomo-darkSurface/50 backdrop-blur-lg border border-white dark:border-white/5 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-3 gap-5 shadow-2xl transition-all duration-300">
          <input
            type="text"
            placeholder="Buscar por titulo o nombre..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full bg-white dark:bg-plomo-darkCanvas border border-slate-200 dark:border-plomo-700/50 rounded-xl px-5 py-3 text-plomo-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all text-sm"
          />

          <input
            type="number"
            placeholder="Precio maximo (USD)"
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
            className="w-full bg-white dark:bg-plomo-darkCanvas border border-slate-200 dark:border-plomo-700/50 rounded-xl px-5 py-3 text-plomo-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all text-sm"
          />

          <select
            value={idHabilidad}
            onChange={(e) => setIdHabilidad(e.target.value)}
            className="w-full bg-white dark:bg-plomo-darkCanvas border border-slate-200 dark:border-plomo-700/50 rounded-xl px-5 py-3 text-plomo-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all text-sm cursor-pointer appearance-none"
          >
            <option value="" className="text-slate-500">Todas las habilidades</option>
            {categorias.map(
              (cat) =>
                cat.habilidades?.length > 0 && (
                  <optgroup key={cat.id_categoria} label={cat.nombre_categoria} className="text-slate-900 dark:text-white font-bold bg-white dark:bg-plomo-darkSurface">
                    {cat.habilidades.map((hab) => (
                      <option key={hab.id_habilidad} value={hab.id_habilidad} className="text-slate-700 dark:text-slate-200 font-medium">
                        {hab.nombre_habilidad}
                      </option>
                    ))}
                  </optgroup>
                )
            )}
          </select>
        </div>
      </div>

      {/* 🔹 Sección de Contenido Principal (Grid de Tarjetas) */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {error ? (
          <div className="bg-red-900/30 backdrop-blur-sm border border-red-500 text-red-100 p-6 rounded-2xl text-center text-sm font-semibold max-w-md mx-auto shadow-xl">
            Excepcion capturada: {error}
          </div>
        ) : loading ? (
          <div className="flex justify-center py-20 text-slate-500 dark:text-slate-400">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
          </div>
        ) : paquetes.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-3xl bg-white/30 dark:bg-white/5 backdrop-blur-sm transition-all duration-300 max-w-md mx-auto shadow-xl">
            <p className="text-slate-600 dark:text-slate-400 text-base font-semibold max-w-xs mx-auto">
              No se encontraron conjuntos de datos que coincidan con la métrica solicitada.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paquetes.map((p) => (
              // Tarjeta Premium (Glassmorphism)
              <div
                key={p.id_paquete}
                className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-lg border border-white/50 dark:border-teal-500/10 rounded-3xl p-8 flex flex-col justify-between hover:border-teal-500/30 dark:hover:border-teal-500/30 transition-all duration-300 shadow-2xl space-y-6"
              >
                {/* Cabecera de la tarjeta: Mentor Info */}
                <div className="flex items-center gap-5 pb-6 border-b border-slate-100 dark:border-white/5">
                  {p.mentor_foto ? (
                    <img
                      src={p.mentor_foto}
                      alt={p.mentor_nombre}
                      className="w-16 h-16 rounded-full object-cover border-4 border-slate-200 dark:border-plomo-700/50 shadow-inner"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-plomo-darkSurface flex items-center justify-center text-plomo-900 dark:text-white font-extrabold text-2xl border-4 border-slate-300 dark:border-plomo-700 shadow-inner">
                      {p.mentor_nombre.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-plomo-900 dark:text-white leading-tight tracking-tight">{p.mentor_nombre}</h3>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-[10px] text-teal-100 font-extrabold tracking-wider uppercase bg-teal-600 dark:bg-teal-700/80 px-2 py-0.5 rounded-full">
                        Verificado
                      </span>
                      <div className="flex items-center gap-1 text-yellow-500 dark:text-yellow-400 font-extrabold text-sm">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm">{p.calificacion_promedio ? `${p.calificacion_promedio}` : 'Nuevo'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenido de la tarjeta: Package Info */}
                <div className="mb-6 flex-1 space-y-4">
                  <h4 className="text-2xl font-black text-purple-700 dark:text-purple-400 tracking-tighter leading-tight drop-shadow-sm">{p.titulo_paquete}</h4>
                  <div className="flex justify-between items-end mt-5 bg-white/30 dark:bg-black/10 p-4 rounded-xl border border-white dark:border-white/5 shadow-inner">
                    <span className="text-slate-600 dark:text-slate-300 text-sm font-semibold">
                      {p.cantidad_horas_totales} Horas
                    </span>
                    <span className="text-3xl font-black text-teal-600 dark:text-teal-300 tracking-tight leading-none">${p.precio_total}</span>
                  </div>
                </div>

                {/* Acciones de la tarjeta: Botones adaptados */}
                <div className="flex gap-4">
                  <button
                    onClick={() => handleContactar(p.id_mentor)}
                    className="flex-1 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 border border-slate-300 dark:border-white/5 text-slate-800 dark:text-white font-bold py-3 rounded-2xl transition-all active:scale-95 shadow-md text-sm"
                  >
                    Mensaje
                  </button>
                  <button
                    onClick={() => handleAdquirir(p.id_paquete)}
                    className="flex-1 bg-gradient-to-tr from-violet-600 to-teal-500 hover:from-violet-700 hover:to-teal-600 text-white font-bold py-3 rounded-2xl transition-all active:scale-95 shadow-lg shadow-purple-500/20 text-sm"
                  >
                    Adquirir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}