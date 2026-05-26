import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { fetchMenteeProfile } from '../../services/profileService';
import { apiClient } from '../../services/apiClient';

const POLL_INTERVAL_MS = 30_000;

export default function MenteeDashboard() {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [sesiones, setSesiones] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  const cargarSesiones = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiClient('/api/sesiones/mentee/me', { method: 'GET' });
      setSesiones(data);
    } catch (e) {
      // fallo silencioso en el refresco — el error inicial ya se maneja abajo
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!token) return;
      setLoadError('');
      try {
        const [profileData, sesionesData] = await Promise.all([
          fetchMenteeProfile(token),
          apiClient('/api/sesiones/mentee/me', { method: 'GET' }),
        ]);
        if (!cancelled) {
          setProfile(profileData);
          setSesiones(sesionesData);
        }
      } catch (e) {
        if (!cancelled) setLoadError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [token]);

  // Polling liviano: solo refresca sesiones para detectar cambio de estado en_curso
  useEffect(() => {
    const hayPendientes = sesiones.some(
      (s) => s.estado_sesion === 'programada' || s.estado_sesion === 'en_curso'
    );
    if (!hayPendientes) return;

    const id = setInterval(cargarSesiones, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [sesiones, cargarSesiones]);

  const tieneNombre = profile?.nombre_completo?.trim();

  return (
    <div className="min-h-screen bg-[#080710] font-['Poppins'] text-white">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-center text-3xl font-bold mb-2">Panel del alumno</h1>

        {loading && (
          <p className="text-white/80 text-center">Cargando datos del panel…</p>
        )}
        {!loading && loadError && (
          <p className="text-red-300 text-center text-sm">{loadError}</p>
        )}

        {!loading && !loadError && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl h-fit">
              <h2 className="text-xl font-bold border-b border-white/10 pb-2 mb-4">Tu Perfil</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-white/50">Nombre</dt>
                  <dd className="text-lg mt-0.5">
                    {tieneNombre ? profile.nombre_completo : 'No configurado'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-white/50">Zona horaria</dt>
                  <dd className="text-lg mt-0.5">{profile.zona_horaria_preferida || 'UTC'}</dd>
                </div>
              </dl>
              <div className="mt-6">
                <Link
                  to="/mentee/completar-perfil"
                  className="inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-500 transition"
                >
                  {tieneNombre ? 'Editar perfil' : 'Completar perfil'}
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
              <h2 className="text-xl font-bold border-b border-white/10 pb-2 mb-4">
                Proximas Sesiones
              </h2>

              {sesiones.length === 0 ? (
                <p className="text-gray-400 text-sm">No tienes sesiones agendadas.</p>
              ) : (
                <ul className="space-y-4">
                  {sesiones.map((s) => (
                    <SesionCardMentee key={s.id_sesion} sesion={s} />
                  ))}
                </ul>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

function SesionCardMentee({ sesion: s }) {
  const enCurso = s.estado_sesion === 'en_curso';
  const programada = s.estado_sesion === 'programada';

  return (
    <li className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800 space-y-3">
      <div>
        <p className="font-semibold text-red-400">{s.titulo_paquete}</p>
        <p className="text-sm text-gray-300">Mentor: {s.contraparte_nombre}</p>
        <p className="text-xs text-gray-500 mt-1">
          {new Date(s.fecha_hora_inicio_utc).toLocaleString()} &mdash;{' '}
          <EstadoBadge estado={s.estado_sesion} />
        </p>
      </div>

      {enCurso && (
        <Link
          to={`/sesion/${s.id_sesion}`}
          className="relative w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-green-700 hover:bg-green-600 text-white transition-all active:scale-[0.98] overflow-hidden"
        >
          {/* anillo pulsante de fondo */}
          <span className="absolute inset-0 rounded-xl bg-green-500/20 animate-ping" />
          <span className="relative flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
            Unirse a la llamada
          </span>
        </Link>
      )}

      {programada && (
        <div className="w-full py-2 rounded-xl text-xs font-semibold text-center text-gray-600 border border-dashed border-gray-800">
          Esperando que el mentor inicie...
        </div>
      )}
    </li>
  );
}

function EstadoBadge({ estado }) {
  const map = {
    programada: 'text-yellow-400',
    en_curso: 'text-green-400',
    finalizada: 'text-blue-400',
    cancelada: 'text-red-400',
    ausente: 'text-gray-500',
  };
  const labels = {
    programada: 'Programada',
    en_curso: 'En curso',
    finalizada: 'Finalizada',
    cancelada: 'Cancelada',
    ausente: 'Ausente',
  };
  return (
    <span className={`font-semibold ${map[estado] ?? 'text-gray-400'}`}>
      {labels[estado] ?? estado}
    </span>
  );
}