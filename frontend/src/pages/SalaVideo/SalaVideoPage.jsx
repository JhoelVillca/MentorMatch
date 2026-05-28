import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

const ESTADO_LABEL = {
  programada: 'Programada',
  en_curso: 'En curso',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
  ausente: 'Ausente',
};

const ESTADO_COLOR = {
  programada: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  en_curso: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
  finalizada: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  cancelada: 'bg-red-500/10 text-red-400 border-red-500/20',
  ausente: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function SalaVideoPage() {
  const { id_sesion } = useParams();
  const navigate = useNavigate();

  const [sesion, setSesion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [accionando, setAccionando] = useState(false);
  const [urlSegura, setUrlSegura] = useState(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  const cargarSesion = async () => {
    try {
      const data = await apiClient(`/api/sesiones/${id_sesion}`);
      setSesion(data);
      if (data.estado_sesion === 'en_curso') pedirTokenVideo(data.url_videollamada);
    } catch (e) { setLoadError(e.message); } finally { setLoading(false); }
  };

  const pedirTokenVideo = async (urlFallback = null) => {
    setLoadingVideo(true);
    try {
      const { url_con_token } = await apiClient(`/api/sesiones/${id_sesion}/token`);
      setUrlSegura(url_con_token);
    } catch (e) {
      const fallback = urlFallback || sesion?.url_videollamada;
      if (fallback) setUrlSegura(fallback);
    } finally { setLoadingVideo(false); }
  };

  useEffect(() => { cargarSesion(); }, [id_sesion]);

  const cambiarEstado = async (accion) => {
    setAccionando(true);
    try {
      await apiClient(`/api/sesiones/${id_sesion}/${accion}`, { method: 'POST' });
      if (accion === 'finalizar') {
        setSesion((prev) => ({ ...prev, estado_sesion: 'finalizada' }));
        setUrlSegura(null);
        setTimeout(() => navigate(-1), 2000);
      } else { await cargarSesion(); await pedirTokenVideo(); }
    } catch (e) { await cargarSesion(); } finally { setAccionando(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-red-500" /></div>;

  if (loadError || !sesion) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="bg-[#111] border border-red-500/20 rounded-3xl p-8 max-w-sm text-center shadow-2xl">
        <p className="text-red-400 font-medium mb-6">{loadError || 'Sesión no encontrada.'}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-white underline underline-offset-4">Volver atrás</button>
      </div>
    </div>
  );

  const puedeIniciar = sesion.estado_sesion === 'programada';
  const puedeEntrar = sesion.estado_sesion === 'en_curso';
  const finalizada = sesion.estado_sesion === 'finalizada';

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans">
      {/* Header Premium */}
      <header className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg></button>
          <div>
            <h1 className="font-semibold text-white">{sesion.titulo_paquete}</h1>
            <p className="text-xs text-gray-500">{sesion.mentor_nombre} • {sesion.mentee_nombre}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-widest ${ESTADO_COLOR[sesion.estado_sesion] ?? ESTADO_COLOR.ausente}`}>
            {ESTADO_LABEL[sesion.estado_sesion] ?? sesion.estado_sesion}
          </span>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Video Stage */}
        <main className="flex-1 bg-black relative min-h-[500px]">
          {puedeEntrar && urlSegura ? (
            <iframe src={urlSegura} allow="camera; microphone; fullscreen; display-capture" className="absolute inset-0 w-full h-full border-0" title="Sala de videollamada" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-[#0a0a0a] to-black">
              {finalizada ? (
                <div className="space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center"><svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></div>
                  <h2 className="text-xl font-bold">Sesión finalizada</h2>
                </div>
              ) : (
                <div className="space-y-6 max-w-sm">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gray-900 flex items-center justify-center"><svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                  <div>
                    <h2 className="text-lg font-semibold">Esperando inicio</h2>
                    <p className="text-sm text-gray-500 mt-2">Programada para: {formatDateTime(sesion.fecha_hora_inicio_utc)}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Sidebar Controls */}
        <aside className="w-full lg:w-80 bg-[#0a0a0a] border-l border-white/5 flex flex-col">
          <div className="p-6 border-b border-white/5 space-y-4">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Controles</h3>
            {DEV_MODE && puedeIniciar && (
              <button onClick={() => cambiarEstado('iniciar')} className="w-full py-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-sm font-semibold hover:bg-amber-500/20 transition-all">Iniciar Ahora (DEV)</button>
            )}
            {puedeEntrar && (
              <button onClick={() => cambiarEstado('finalizar')} disabled={accionando} className="w-full py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {accionando ? 'Procesando...' : 'Finalizar Sesión'}
              </button>
            )}
            {finalizada && <div className="w-full py-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-sm text-center font-medium">Sesión completada</div>}
          </div>

          <div className="p-6 space-y-6">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Detalles</h3>
            <div className="space-y-4">
              <InfoRow label="Mentor" value={sesion.mentor_nombre} />
              <InfoRow label="Alumno" value={sesion.mentee_nombre} />
              <InfoRow label="Inicio" value={formatDateTime(sesion.fecha_hora_inicio_utc)} />
            </div>
            {sesion.url_videollamada && (
              <a href={sesion.url_videollamada} target="_blank" rel="noopener noreferrer" className="block text-xs text-gray-500 hover:text-white underline underline-offset-4 mt-4">Abrir enlace externo</a>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase text-gray-600 mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-200">{value}</p>
    </div>
  );
}