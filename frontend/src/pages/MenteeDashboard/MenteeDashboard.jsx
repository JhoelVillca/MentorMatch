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
      // fallo silencioso
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
    // Contenedor principal con fondo abstracto
    <div className="min-h-screen bg-cover bg-center bg-fixed p-6 font-['Poppins'] text-white" 
         style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
      
      {/* Overlay para legibilidad */}
      <div className="min-h-screen bg-black/40 backdrop-blur-sm p-4 md:p-12">
        <div className="container mx-auto max-w-5xl">
          <h1 className="text-center text-4xl font-extrabold mb-10 text-white drop-shadow-lg">
            Bienvenido, <span className="text-pink-400">{tieneNombre ? profile.nombre_completo : 'Alumno'}</span>
          </h1>

          {loading && <p className="text-center animate-pulse">Cargando tu espacio...</p>}
          
          {!loading && !loadError && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Tarjeta de Perfil */}
              <div className="md:col-span-1 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 shadow-2xl transition-all hover:bg-white/15">
                <h2 className="text-2xl font-bold mb-6">Tu Perfil</h2>
                <div className="space-y-6">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-pink-300 font-semibold">Nombre</p>
                    <p className="text-lg mt-1">{tieneNombre ? profile.nombre_completo : 'No configurado'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-pink-300 font-semibold">Zona horaria</p>
                    <p className="text-lg mt-1">{profile.zona_horaria_preferida || 'UTC'}</p>
                  </div>
                </div>
                <Link to="/mentee/completar-perfil" 
                      className="mt-8 block text-center rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 px-6 py-3 font-bold hover:opacity-90 transition-all shadow-lg shadow-pink-500/20">
                  {tieneNombre ? 'Editar perfil' : 'Completar perfil'}
                </Link>
              </div>

              {/* Tarjeta de Sesiones */}
              <div className="md:col-span-2 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold mb-6">Próximas Sesiones</h2>
                {sesiones.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-white/10 rounded-2xl">
                    <p className="text-gray-300">No tienes sesiones agendadas por ahora.</p>
                  </div>
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
    </div>
  );
}

function SesionCardMentee({ sesion: s }) {
  const enCurso = s.estado_sesion === 'en_curso';
  const programada = s.estado_sesion === 'programada';

  return (
    <li className="bg-black/20 p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 hover:bg-white/5 transition-all">
      <div>
        <p className="font-bold text-lg text-pink-300">{s.titulo_paquete}</p>
        <p className="text-sm text-gray-300">Mentor: <span className="font-semibold text-white">{s.contraparte_nombre}</span></p>
        <p className="text-xs text-gray-400 mt-1">
          {new Date(s.fecha_hora_inicio_utc).toLocaleString()} &mdash; <EstadoBadge estado={s.estado_sesion} />
        </p>
      </div>

      {enCurso && (
        <Link to={`/sesion/${s.id_sesion}`} className="relative flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/30 transition-all hover:scale-105">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          Unirse a la llamada
        </Link>
      )}

      {programada && (
        <div className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 border border-white/10">
          Esperando inicio...
        </div>
      )}
    </li>
  );
}

function EstadoBadge({ estado }) {
  const map = {
    programada: 'text-yellow-300',
    en_curso: 'text-green-300',
    finalizada: 'text-blue-300',
    cancelada: 'text-red-300',
    ausente: 'text-gray-400',
  };
  return <span className={`font-bold ${map[estado] ?? 'text-gray-400'}`}>{estado.replace('_', ' ')}</span>;
}