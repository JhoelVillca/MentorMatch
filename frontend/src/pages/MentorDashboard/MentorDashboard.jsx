import { useEffect, useState } from 'react';
import MentorSkillForm from '../../components/MentorSkillForm';
import { apiClient } from '../../services/apiClient';

export default function MentorDashboard() {
  const [sesiones, setSesiones] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient('/api/sesiones/mentor/me', { method: 'GET' })
      .then(data => setSesiones(data))
      .catch(err => setError(err.message));
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-white text-center mt-10 text-3xl font-bold mb-8">Mentor Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <MentorSkillForm />
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl shadow-xl h-fit">
          <h2 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Agenda de Sesiones</h2>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          
          {!error && sesiones.length === 0 ? (
            <p className="text-gray-400 text-sm">Nadie ha agendado sesiones contigo aun.</p>
          ) : (
            <ul className="space-y-4">
              {sesiones.map(s => (
                <li key={s.id_sesion} className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800 text-white">
                  <p className="font-semibold text-blue-400">{s.titulo_paquete}</p>
                  <p className="text-sm">Alumno: {s.contraparte_nombre}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(s.fecha_hora_inicio_utc).toLocaleString()} - Estado: {s.estado_sesion}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}