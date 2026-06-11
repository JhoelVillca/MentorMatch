import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MentorSkillForm from '../../components/MentorSkillForm';
import { apiClient } from '../../services/apiClient';
import { Video, Users, BookOpen, ChevronLeft, ChevronRight, CircleCheck as CheckCircle, Circle as XCircle, TrendingUp, Clock } from 'lucide-react';

export default function MentorDashboard() {
  const navigate = useNavigate();
  const [sesiones, setSesiones] = useState([]);
  const [error, setError] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [estudiantesData, setEstudiantesData] = useState({ data: [], total: 0 });
  const [page, setPage] = useState(1);
  const [toastMsg, setToastMsg] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const limit = 10;

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 4000);
    return () => clearTimeout(t);
  }, [toastMsg]);

  useEffect(() => {
    Promise.all([
      apiClient('/api/sesiones/mentor/me', { method: 'GET' }),
      apiClient('/api/contratos/solicitudes', { method: 'GET' }),
    ]).then(([s, sol]) => {
      setSesiones(s);
      setSolicitudes(sol);
      setLoaded(true);
    }).catch(err => {
      if (err.status === 403) {
        navigate('/mentor/completar-perfil');
      } else {
        setError(err.message);
      }
    });
  }, [navigate]);

  useEffect(() => {
    const offset = (page - 1) * limit;
    apiClient(`/api/contratos/mis-estudiantes?limit=${limit}&offset=${offset}`, { method: 'GET' })
      .then(res => setEstudiantesData(res))
      .catch(console.error);
  }, [page]);

  const responderSolicitud = async (id, accion) => {
    try {
      await apiClient(`/api/contratos/${id}/${accion}`, { method: 'PATCH' });
      setSolicitudes(prev => prev.filter(s => s.id_contrato !== id));
      setToastMsg({ type: 'success', text: `Solicitud ${accion === 'aceptar' ? 'aceptada' : 'rechazada'}.` });
    } catch (err) {
      setToastMsg({ type: 'error', text: err.message });
    }
  };

  const stats = [
    { label: 'Sesiones activas', value: sesiones.filter(s => s.estado_sesion === 'en_curso' || s.estado_sesion === 'programada').length, icon: Video, color: 'text-blue-600 bg-blue-50', border: 'border-blue-100' },
    { label: 'Estudiantes', value: estudiantesData.total, icon: Users, color: 'text-emerald-600 bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Solicitudes', value: solicitudes.length, icon: BookOpen, color: 'text-amber-600 bg-amber-50', border: 'border-amber-100' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Toast */}
      {toastMsg && (
        <div className={`toast-enter fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg border flex items-center gap-2.5 ${
          toastMsg.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle size={15} /> : null}
          {toastMsg.text}
        </div>
      )}

      {/* Header */}
      <div className="mb-8 animate-in">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Panel del Mentor</h1>
            <p className="text-slate-500 mt-1">Gestiona tus sesiones, habilidades y estudiantes.</p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-100 rounded-full px-3 py-1.5 shadow-sm">
            <TrendingUp size={12} className="text-emerald-500" />
            <span>Todo al día</span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, border }, i) => (
          <div
            key={label}
            className={`animate-in bg-white rounded-2xl border ${border} p-4 flex items-center gap-3 shadow-sm`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 count-up" style={{ animationDelay: `${i * 80 + 100}ms` }}>{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 animate-in">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Skills form */}
        <div className="lg:col-span-1 animate-in" style={{ animationDelay: '120ms' }}>
          <MentorSkillForm />
        </div>

        {/* Sessions */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-in" style={{ animationDelay: '160ms' }}>
          <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
              <Video size={13} className="text-blue-600" />
            </div>
            Agenda de sesiones
          </h2>
          {sesiones.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
                <Video size={22} className="text-slate-300" />
              </div>
              <p className="text-sm text-slate-500">Sin sesiones programadas.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {sesiones.map((s, i) => (
                <div key={s.id_sesion} className="slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <SesionCardMentor sesion={s} />
                </div>
              ))}
            </ul>
          )}
        </div>

        {/* Scholarship requests */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-in" style={{ animationDelay: '200ms' }}>
          <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
              <BookOpen size={13} className="text-amber-600" />
            </div>
            Solicitudes de beca
            {solicitudes.length > 0 && (
              <span className="ml-auto text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{solicitudes.length}</span>
            )}
          </h2>
          {solicitudes.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
                <BookOpen size={22} className="text-slate-300" />
              </div>
              <p className="text-sm text-slate-500">Sin solicitudes pendientes.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {solicitudes.map((sol, i) => (
                <li
                  key={sol.id_contrato}
                  className="slide-up bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-slate-200 transition-colors"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <p className="text-sm font-semibold text-slate-800">{sol.mentee_nombre}</p>
                  <p className="text-xs text-slate-500 mb-2">Paquete: {sol.paquete_titulo}</p>
                  <blockquote className="text-xs text-slate-600 italic border-l-2 border-amber-300 pl-3 mb-3 leading-relaxed">
                    "{sol.carta_motivacion}"
                  </blockquote>
                  <div className="flex gap-2">
                    <button
                      onClick={() => responderSolicitud(sol.id_contrato, 'aceptar')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-300 text-xs font-semibold transition-all active:scale-95"
                    >
                      <CheckCircle size={13} />Conceder
                    </button>
                    <button
                      onClick={() => responderSolicitud(sol.id_contrato, 'rechazar')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300 text-xs font-semibold transition-all active:scale-95"
                    >
                      <XCircle size={13} />Rechazar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Students table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in" style={{ animationDelay: '240ms' }}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Users size={13} className="text-emerald-600" />
            </div>
            Estudiantes activos
          </h2>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">{estudiantesData.total} total</span>
        </div>

        {estudiantesData.data.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
              <Users size={22} className="text-slate-300" />
            </div>
            <p className="text-sm text-slate-500">Aún no tienes estudiantes activos.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Mentee</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Paquete</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Horas usadas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {estudiantesData.data.map((est, i) => (
                    <tr
                      key={est.id_contrato}
                      className="hover:bg-slate-50/70 transition-colors group slide-up"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold flex-shrink-0">
                            {est.mentee_nombre.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-900">{est.mentee_nombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{est.titulo_paquete}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-primary-50 text-primary-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-primary-100">
                          {est.horas_consumidas}h
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {estudiantesData.total > limit && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-40 transition-all"
                >
                  <ChevronLeft size={14} />Anterior
                </button>
                <span className="text-xs text-slate-500 bg-slate-50 px-3 py-1 rounded-full">Página {page} de {Math.ceil(estudiantesData.total / limit)}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(estudiantesData.total / limit)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-40 transition-all"
                >
                  Siguiente<ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SesionCardMentor({ sesion: s }) {
  const enCurso = s.estado_sesion === 'en_curso';
  const programada = s.estado_sesion === 'programada';

  return (
    <li className={`rounded-xl border p-4 transition-all ${
      enCurso ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100'
    }`}>
      <div className="flex items-start justify-between mb-1">
        <p className="text-sm font-semibold text-slate-800">{s.titulo_paquete}</p>
        <EstadoBadge estado={s.estado_sesion} />
      </div>
      <p className="text-xs text-slate-500 mb-1">Alumno: {s.contraparte_nombre}</p>
      <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
        <Clock size={11} />
        {new Date(s.fecha_hora_inicio_utc).toLocaleString()}
      </p>
      {(programada || enCurso) && (
        <Link
          to={`/sesion/${s.id_sesion}`}
          className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
            enCurso ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm' : 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm'
          }`}
        >
          <Video size={13} />
          {enCurso ? 'Continuar llamada' : 'Iniciar llamada'}
        </Link>
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
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.class}`}>{c.label}</span>
  );
}
