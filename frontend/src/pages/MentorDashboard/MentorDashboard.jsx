import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MentorSkillForm from '../../components/MentorSkillForm';
import { apiClient } from '../../services/apiClient';

export default function MentorDashboard() {
  const [sesiones, setSesiones] = useState([]);
  const [error, setError] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);

  useEffect(() => {
    apiClient('/api/sesiones/mentor/me', { method: 'GET' })
      .then((data) => setSesiones(data))
      .catch((err) => setError(err.message));

    apiClient('/api/contratos/solicitudes', { method: 'GET' })
      .then((data) => setSolicitudes(data))
      .catch(console.error);
  }, []);

  const responderSolicitud = async (id, accion) => {
    try {
      await apiClient(`/api/contratos/${id}/${accion}`, { method: 'PATCH' });
      setSolicitudes(prev => prev.filter(s => s.id_contrato !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-white text-center mt-10 text-3xl font-bold mb-8">Mentor Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <MentorSkillForm />
        </div>

        <div className="flex flex-col gap-8">
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl shadow-xl h-fit">
            <h2 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">
              Agenda de Sesiones
            </h2>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            {!error && sesiones.length === 0 ? (
              <p className="text-gray-400 text-sm">Nadie ha agendado sesiones contigo aun.</p>
            ) : (
              <ul className="space-y-4">
                {sesiones.map((s) => (
                  <SesionCardMentor key={s.id_sesion} sesion={s} />
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">
              El Panel del Juez (Becas)
            </h2>
            {solicitudes.length === 0 ? (
              <p className="text-gray-400 text-sm">No hay peticiones de caridad hoy.</p>
            ) : (
              <ul className="space-y-4">
                {solicitudes.map((sol) => (
                  <li key={sol.id_contrato} className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800 text-white flex flex-col gap-3">
                    <div>
                      <p className="font-semibold text-blue-400">{sol.mentee_nombre} <span className="text-xs text-gray-500 font-normal">quiere el paquete "{sol.paquete_titulo}"</span></p>
                      <p className="text-sm text-gray-300 mt-2 bg-[#141414] p-3 border border-gray-700 rounded-md italic">"{sol.carta_motivacion}"</p>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => responderSolicitud(sol.id_contrato, 'aceptar')} className="flex-1 bg-green-700/20 text-green-400 border border-green-700 hover:bg-green-700 hover:text-white py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1">
                        ✓ Conceder
                      </button>
                      <button onClick={() => responderSolicitud(sol.id_contrato, 'rechazar')} className="flex-1 bg-red-700/20 text-red-400 border border-red-700 hover:bg-red-700 hover:text-white py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1">
                        ✗ Rechazar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SesionCardMentor({ sesion: s }) {
  const enCurso = s.estado_sesion === 'en_curso';
  const programada = s.estado_sesion === 'programada';

  return (
    <li className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800 text-white space-y-3">
      <div>
        <p className="font-semibold text-blue-400">{s.titulo_paquete}</p>
        <p className="text-sm text-gray-300">Alumno: {s.contraparte_nombre}</p>
        <p className="text-xs text-gray-500 mt-1">
          {new Date(s.fecha_hora_inicio_utc).toLocaleString()} &mdash;{' '}
          <EstadoBadge estado={s.estado_sesion} />
        </p>
      </div>

      {(programada || enCurso) && (
        <Link
          to={`/sesion/${s.id_sesion}`}
          className={`
            w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
            text-sm font-bold transition-all active:scale-[0.98]
            ${enCurso
              ? 'bg-green-700 hover:bg-green-600 text-white'
              : 'bg-blue-700 hover:bg-blue-600 text-white'
            }
          `}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {enCurso ? 'Continuar llamada' : 'Iniciar llamada'}
        </Link>
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