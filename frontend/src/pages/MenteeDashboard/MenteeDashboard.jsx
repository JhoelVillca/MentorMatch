import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { fetchMenteeProfile } from '../../services/profileService';
import { apiClient } from '../../services/apiClient';
import { User, Clock, Calendar, BookOpen, ArrowRight, Video, Sparkles, TrendingUp, FileText } from 'lucide-react';

const POLL_INTERVAL_MS = 30_000;

export default function MenteeDashboard() {
  const navigate = useNavigate();
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
    } catch {}
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
        if (e.status === 403) {
          navigate('/mentee/completar-perfil');
          return;
        }
        if (!cancelled) setLoadError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [token, navigate]);

  useEffect(() => {
    const hayPendientes = sesiones.some(s => s.estado_sesion === 'programada' || s.estado_sesion === 'en_curso');
    if (!hayPendientes) return;
    const id = setInterval(cargarSesiones, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [sesiones, cargarSesiones]);

  const tieneNombre = profile?.nombre_completo?.trim();
  const firstName = tieneNombre ? profile.nombre_completo.split(' ')[0] : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-9 h-9 rounded-full border-2 border-slate-200 border-t-primary-600 animate-spin" />
      </div>
    );
  }

  const quickActions = [
    { to: '/catalog', icon: BookOpen, label: 'Explorar mentores', desc: 'Encuentra tu mentor ideal', color: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' },
    { to: '/mentee/agendar', icon: Calendar, label: 'Agendar sesión', desc: 'Reserva una nueva sesión', color: 'bg-teal-50 text-teal-600 group-hover:bg-teal-100' },
    { to: '/mentee/contratos', icon: FileText, label: 'Mis contratos', desc: 'Ver horas y estado', color: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Welcome banner */}
      <div className="mb-8 animate-in">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-amber-500" />
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">Bienvenido de vuelta</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {tieneNombre ? `Hola, ${firstName}!` : 'Mi Panel'}
            </h1>
            <p className="text-slate-500 mt-1">Aquí está el resumen de tu actividad.</p>
          </div>
          {sesiones.some(s => s.estado_sesion === 'en_curso') && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-green-700">Sesión en curso</span>
            </div>
          )}
        </div>
      </div>

      {loadError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 animate-in">{loadError}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-in" style={{ animationDelay: '60ms' }}>
          <div className="flex items-center gap-3 mb-5">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.nombre_completo} className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 ring-2 ring-primary-50" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 border-2 border-primary-100 flex items-center justify-center ring-2 ring-primary-50">
                <User size={22} className="text-primary-600" />
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-900">{tieneNombre ? profile.nombre_completo : 'Sin nombre'}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock size={11} className="text-slate-400" />
                <p className="text-xs text-slate-500">{profile?.zona_horaria_preferida || 'UTC'}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50">
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-slate-500">Zona horaria</span>
              <span className="text-xs font-medium text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg">{profile?.zona_horaria_preferida || 'UTC'}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-slate-500">Sesiones totales</span>
              <span className="text-xs font-medium text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg">{sesiones.length}</span>
            </div>
          </div>

          <Link
            to="/mentee/completar-perfil"
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary-50 hover:bg-primary-100 text-primary-700 text-sm font-medium rounded-xl transition-all group"
          >
            {tieneNombre ? 'Editar perfil' : 'Completar perfil'}
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-in" style={{ animationDelay: '120ms' }}>
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-primary-500" />
            Acciones rápidas
          </h2>
          <div className="space-y-2">
            {quickActions.map(({ to, icon: Icon, label, desc, color }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all group"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${color}`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{label}</p>
                  <p className="text-xs text-slate-500 truncate">{desc}</p>
                </div>
                <ArrowRight size={13} className="text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming sessions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-in" style={{ animationDelay: '180ms' }}>
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Calendar size={14} className="text-primary-500" />
            Próximas sesiones
            {sesiones.length > 0 && (
              <span className="ml-auto text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{sesiones.length}</span>
            )}
          </h2>
          {sesiones.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
                <Calendar size={22} className="text-slate-300" />
              </div>
              <p className="text-sm text-slate-500">Sin sesiones agendadas.</p>
              <Link to="/mentee/agendar" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors">
                Agendar ahora <ArrowRight size={12} />
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {sesiones.map((s, i) => (
                <div key={s.id_sesion} className="slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <SesionCard sesion={s} />
                </div>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function SesionCard({ sesion: s }) {
  const enCurso = s.estado_sesion === 'en_curso';
  const programada = s.estado_sesion === 'programada';

  return (
    <li className={`rounded-xl border p-4 transition-all ${
      enCurso ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100 hover:border-slate-200'
    }`}>
      <div className="flex items-start justify-between mb-1">
        <p className="text-sm font-semibold text-slate-800 leading-tight">{s.titulo_paquete}</p>
        <EstadoBadge estado={s.estado_sesion} />
      </div>
      <p className="text-xs text-slate-500 mb-1">con {s.contraparte_nombre}</p>
      <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
        <Clock size={11} />
        {new Date(s.fecha_hora_inicio_utc).toLocaleString()}
      </p>

      {enCurso && (
        <Link
          to={`/sesion/${s.id_sesion}`}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-all active:scale-95 shadow-sm"
        >
          <Video size={13} />
          Unirse ahora
        </Link>
      )}
      {programada && (
        <div className="w-full py-1.5 rounded-lg text-xs text-center text-slate-400 border border-dashed border-slate-200 bg-white">
          Esperando inicio...
        </div>
      )}
    </li>
  );
}

function EstadoBadge({ estado }) {
  const config = {
    programada: { label: 'Programada', class: 'text-amber-700 bg-amber-50 border-amber-200' },
    en_curso: { label: 'En curso', class: 'text-green-700 bg-green-100 border-green-200' },
    finalizada: { label: 'Finalizada', class: 'text-blue-700 bg-blue-50 border-blue-200' },
    cancelada: { label: 'Cancelada', class: 'text-red-700 bg-red-50 border-red-200' },
    ausente: { label: 'Ausente', class: 'text-slate-500 bg-slate-100 border-slate-200' },
  };
  const c = config[estado] || { label: estado, class: 'text-slate-500 bg-slate-50 border-slate-200' };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${c.class}`}>{c.label}</span>;
}
