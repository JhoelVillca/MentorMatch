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
  programada: 'text-yellow-400 border-yellow-700 bg-yellow-900/20',
  en_curso: 'text-green-400 border-green-700 bg-green-900/20',
  finalizada: 'text-blue-400 border-blue-700 bg-blue-900/20',
  cancelada: 'text-red-400 border-red-700 bg-red-900/20',
  ausente: 'text-gray-400 border-gray-700 bg-gray-900/20',
};

function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
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
      if (data.estado_sesion === 'en_curso') {
        pedirTokenVideo(data.url_videollamada);
      }
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const pedirTokenVideo = async (urlFallback = null) => {
    setLoadingVideo(true);
    try {
      const { url_con_token } = await apiClient(`/api/sesiones/${id_sesion}/token`);
      setUrlSegura(url_con_token);
    } catch (e) {
      console.error("Fallo al obtener el token seguro:", e);
      const fallback = urlFallback || sesion?.url_videollamada;
      if (fallback) {
        setUrlSegura(fallback); 
      }
    } finally {
      setLoadingVideo(false);
    }
  };

  useEffect(() => {
    cargarSesion();
  }, [id_sesion]);

  const cambiarEstado = async (accion) => {
    setAccionando(true);
    try {
      await apiClient(`/api/sesiones/${id_sesion}/${accion}`, { method: 'POST' });

      if (accion === 'finalizar') {
        setSesion((prev) => ({ ...prev, estado_sesion: 'finalizada' }));
        setUrlSegura(null); // Matamos el iframe
        setTimeout(() => navigate(-1), 2000);
      } else {
        await cargarSesion();
        await pedirTokenVideo();
      }
    } catch (e) {
      await cargarSesion();
    } finally {
      setAccionando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080710] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600" />
      </div>
    );
  }

  if (loadError || !sesion) {
    return (
      <div className="min-h-screen bg-[#080710] flex items-center justify-center px-4">
        <div className="bg-[#141414] border border-red-900/40 rounded-2xl p-8 max-w-md w-full text-center">
          <p className="text-red-400 font-semibold mb-4">{loadError || 'Sesión no encontrada.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  const puedeIniciar = sesion.estado_sesion === 'programada';
  const puedeEntrar = sesion.estado_sesion === 'en_curso';
  const finalizada = sesion.estado_sesion === 'finalizada';

  return (
    <div className="min-h-screen bg-[#080710] text-white font-['Poppins'] flex flex-col">

      <div className="border-b border-white/5 bg-[#0d0d0d] px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
            title="Volver"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{sesion.titulo_paquete}</p>
            <p className="text-xs text-gray-500 truncate">
              {sesion.mentor_nombre} &mdash; {sesion.mentee_nombre}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full border ${
              ESTADO_COLOR[sesion.estado_sesion] ?? ESTADO_COLOR.ausente
            }`}
          >
            {ESTADO_LABEL[sesion.estado_sesion] ?? sesion.estado_sesion}
          </span>

          <div className="text-xs text-gray-500 hidden sm:block">
            {formatDateTime(sesion.fecha_hora_inicio_utc)}
            {' — '}
            {formatDateTime(sesion.fecha_hora_fin_utc)}
          </div>
        </div>
      </div>

      {/* DEV BANNER — eliminar junto con el boton cuando se vaya a produccion */}
      {DEV_MODE && (
        <div className="bg-amber-950/60 border-b border-amber-700/40 px-4 py-2 flex items-center gap-2 text-xs text-amber-400">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>MODO DESARROLLO — el boton "Iniciar ahora" no existe en produccion. Setea VITE_DEV_MODE=false para ocultarlo.</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row flex-1 gap-0">

        <div className="flex-1 bg-black relative min-h-[400px] lg:min-h-0">
          {puedeEntrar ? (
            urlSegura ? (
              <iframe
                src={urlSegura}
                allow="camera; microphone; fullscreen; display-capture"
                className="absolute inset-0 w-full h-full border-0"
                title="Sala de videollamada"
              />
            ) : loadingVideo ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <svg className="w-8 h-8 animate-spin text-red-600 mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <p>Estableciendo conexion segura...</p>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500">
                <p>No se pudo conectar al servidor de video.</p>
              </div>
            )
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
              {finalizada ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-blue-900/30 border border-blue-700/50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm">Sesion finalizada. Las horas han sido registradas.</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-gray-900/50 border border-gray-700/50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-300 font-semibold text-sm mb-1">
                      La sesion empieza el {formatDateTime(sesion.fecha_hora_inicio_utc)}
                    </p>
                    <p className="text-gray-600 text-xs">
                      La sala se activara cuando el anfitrion inicie la sesion.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="w-full lg:w-72 bg-[#0d0d0d] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col">

          <div className="p-5 border-b border-white/5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Controles de sesion
            </h3>



            {/* BOTON DEV: Iniciar ahora — ELIMINAR EN PRODUCCION */}
            {DEV_MODE && puedeIniciar && (
              <button
                onClick={() => cambiarEstado('iniciar')}
                disabled={accionando}
                className="w-full py-2.5 rounded-xl text-xs font-bold border border-dashed border-amber-700/60 text-amber-400 hover:bg-amber-900/20 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                [DEV] Iniciar ahora
              </button>
            )}
            {/* FIN BOTON DEV */}

            {puedeIniciar && !DEV_MODE && (
              <div className="text-xs text-gray-600 italic text-center py-2">
                Esperando hora de inicio...
              </div>
            )}

            {puedeEntrar && (
              <button
                onClick={() => cambiarEstado('finalizar')}
                disabled={accionando}
                className="w-full py-2.5 rounded-xl text-sm font-bold bg-red-700 hover:bg-red-600 text-white transition-all disabled:opacity-40 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {accionando ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                )}
                Finalizar sesion
              </button>
            )}

            {finalizada && (
              <div className="w-full py-2.5 rounded-xl text-sm font-semibold bg-blue-900/20 border border-blue-700/30 text-blue-400 text-center">
                Sesion completada
              </div>
            )}
          </div>

          <div className="p-5 space-y-4 flex-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Informacion
            </h3>
            <div className="space-y-3">
              <InfoRow label="Mentor" value={sesion.mentor_nombre} />
              <InfoRow label="Alumno" value={sesion.mentee_nombre} />
              <InfoRow label="Paquete" value={sesion.titulo_paquete} />
              <InfoRow
                label="Inicio"
                value={formatDateTime(sesion.fecha_hora_inicio_utc)}
              />
              <InfoRow
                label="Fin"
                value={formatDateTime(sesion.fecha_hora_fin_utc)}
              />
            </div>

            {sesion.url_videollamada && (
              <a
                href={sesion.url_videollamada}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-red-500 hover:text-red-400 transition-colors mt-4"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Abrir en nueva pestana
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray-600">{label}</p>
      <p className="text-sm text-gray-300 mt-0.5">{value}</p>
    </div>
  );
}
