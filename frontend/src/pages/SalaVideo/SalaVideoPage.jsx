import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { ChevronLeft, Video, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Square, ExternalLink } from 'lucide-react';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

const ESTADO_LABEL = {
  programada: 'Programada',
  en_curso: 'En curso',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
  ausente: 'Ausente',
};

const ESTADO_COLOR = {
  programada: 'text-amber-600 border-amber-200 bg-amber-50',
  en_curso: 'text-green-600 border-green-200 bg-green-50',
  finalizada: 'text-blue-600 border-blue-200 bg-blue-50',
  cancelada: 'text-red-600 border-red-200 bg-red-50',
  ausente: 'text-slate-500 border-slate-200 bg-slate-100',
};

function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
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
      if (fallback) setUrlSegura(fallback);
    } finally {
      setLoadingVideo(false);
    }
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-primary-600 animate-spin" />
      </div>
    );
  }

  if (loadError || !sesion) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-slate-800 font-semibold mb-4">{loadError || 'Sesión no encontrada.'}</p>
          <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-500 hover:text-slate-900 transition-colors flex-shrink-0 p-1 hover:bg-slate-100 rounded-lg"
            title="Volver"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{sesion.titulo_paquete}</p>
            <p className="text-xs text-slate-500 truncate">{sesion.mentor_nombre} &mdash; {sesion.mentee_nombre}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${ESTADO_COLOR[sesion.estado_sesion] ?? ESTADO_COLOR.ausente}`}>
            {ESTADO_LABEL[sesion.estado_sesion] ?? sesion.estado_sesion}
          </span>
          <div className="text-xs text-slate-500 hidden sm:block">
            {formatDateTime(sesion.fecha_hora_inicio_utc)} &mdash; {formatDateTime(sesion.fecha_hora_fin_utc)}
          </div>
        </div>
      </div>

      {DEV_MODE && (
        <div className="bg-amber-950/60 border-b border-amber-700/40 px-4 py-2 flex items-center gap-2 text-xs text-amber-400">
          <AlertCircle size={13} className="flex-shrink-0" />
          MODO DESARROLLO — el botón "Iniciar ahora" no existe en producción. Setea VITE_DEV_MODE=false para ocultarlo.
        </div>
      )}

      <div className="flex flex-col lg:flex-row flex-1 gap-0">
        {/* Video area */}
        <div className="flex-1 bg-slate-100 relative min-h-[400px] lg:min-h-0 border-r border-slate-200">
          {puedeEntrar ? (
            urlSegura ? (
              <iframe
                src={urlSegura}
                allow="camera; microphone; fullscreen; display-capture"
                className="absolute inset-0 w-full h-full border-0"
                title="Sala de videollamada"
              />
            ) : loadingVideo ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-4">
                <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-primary-600 animate-spin" />
                <p className="text-sm">Estableciendo conexión segura...</p>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400">
                <p className="text-sm">No se pudo conectar al servidor de video.</p>
              </div>
            )
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center bg-white">
              {finalizada ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-slate-600 text-sm">Sesión finalizada. Las horas han sido registradas.</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                    <Video className="w-8 h-8 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-slate-800 font-semibold text-sm mb-1">
                      La sesión empieza el {formatDateTime(sesion.fecha_hora_inicio_utc)}
                    </p>
                    <p className="text-slate-500 text-xs">
                      La sala se activará cuando el anfitrión inicie la sesión.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="w-full lg:w-72 bg-white flex flex-col border-l border-slate-200">
          <div className="p-5 border-b border-slate-100 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Controles de sesión</h3>

            {DEV_MODE && puedeIniciar && (
              <button
                onClick={() => cambiarEstado('iniciar')}
                disabled={accionando}
                className="w-full py-2.5 rounded-xl text-xs font-bold border border-dashed border-amber-700/60 text-amber-400 hover:bg-amber-900/20 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <AlertCircle size={13} />[DEV] Iniciar ahora
              </button>
            )}

            {puedeIniciar && !DEV_MODE && (
              <div className="text-xs text-slate-600 italic text-center py-2">
                Esperando hora de inicio...
              </div>
            )}

            {puedeEntrar && (
              <button
                onClick={() => cambiarEstado('finalizar')}
                disabled={accionando}
                className="w-full py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-all disabled:opacity-40 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {accionando ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Square size={14} />
                )}
                Finalizar sesión
              </button>
            )}

            {finalizada && (
              <div className="w-full py-2.5 rounded-xl text-sm font-semibold bg-blue-50 border border-blue-200 text-blue-600 text-center flex items-center justify-center gap-2">
                <CheckCircle size={14} />Sesión completada
              </div>
            )}
          </div>

          <div className="p-5 space-y-4 flex-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Información</h3>
            <div className="space-y-3">
              <InfoRow label="Mentor" value={sesion.mentor_nombre} />
              <InfoRow label="Alumno" value={sesion.mentee_nombre} />
              <InfoRow label="Paquete" value={sesion.titulo_paquete} />
              <InfoRow label="Inicio" value={formatDateTime(sesion.fecha_hora_inicio_utc)} />
              <InfoRow label="Fin" value={formatDateTime(sesion.fecha_hora_fin_utc)} />
            </div>

            {sesion.url_videollamada && (
              <a
                href={sesion.url_videollamada}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-primary-400 hover:text-primary-300 transition-colors mt-4"
              >
                <ExternalLink size={13} />Abrir en nueva pestaña
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
      <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm text-slate-800 mt-0.5 font-medium">{value}</p>
    </div>
  );
}
