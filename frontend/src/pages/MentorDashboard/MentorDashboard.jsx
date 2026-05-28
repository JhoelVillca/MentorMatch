import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MentorSkillForm from '../../components/MentorSkillForm';
import { apiClient } from '../../services/apiClient';

export default function MentorDashboard() {
  const [sesiones, setSesiones] = useState([]);
  const [error, setError] = useState(null);
  // Estado para el tema: true es modo oscuro, false es modo claro
  const [isDark, setIsDark] = useState(true);

  // Sincronizar el tema con el documento al cambiar el estado
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    apiClient('/api/sesiones/mentor/me', { method: 'GET' })
      .then((data) => setSesiones(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className={`min-h-screen font-['Poppins'] flex flex-col relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#0a0a0c] text-white' : 'bg-slate-100 text-slate-900'}`}>
      
      {/* 🌟 Fondo Abstracto */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" 
          alt="Fondo Vibrante" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className={`absolute inset-0 bg-gradient-to-tr ${isDark ? 'from-purple-900/40 via-blue-900/20' : 'from-blue-200/40 via-purple-100/20'} to-transparent`}></div>
      </div>

      {/* Botón de Tema (Utilizando el que ya tienes en la esquina inferior) */}
      <button 
        onClick={() => setIsDark(!isDark)}
        className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all shadow-lg"
      >
        {isDark ? '☀️' : '🌙'}
      </button>

      <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-7xl z-10 flex-1">
        
        <h1 className="text-3xl font-extrabold tracking-tight text-center mt-6 mb-12 drop-shadow-lg">
          Mentor <span className="text-celeste">Dashboard</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Formulario (Forzado a blanco para legibilidad) */}
          <div className="lg:col-span-1 h-fit relative">
            <div className="bg-white p-6 rounded-3xl shadow-2xl text-slate-900 [&_input]:text-black [&_input]:border-slate-300 [&_label]:text-slate-900">
              <MentorSkillForm />
            </div>
          </div>

          {/* Agenda de Sesiones */}
          <div className={`lg:col-span-2 p-6 sm:p-8 rounded-3xl shadow-2xl border backdrop-blur-xl ${isDark ? 'bg-white/10 border-white/10' : 'bg-white/60 border-slate-200'}`}>
            <div className="flex items-center justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-4 mb-6">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-3">
                <svg className="w-6 h-6 text-celeste" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Agenda de Sesiones
              </h2>
            </div>

            {error && (
              <div className="mb-6 bg-red-500/20 border border-red-500/50 p-4 rounded-xl text-red-500 text-sm font-semibold">
                Error: {error}
              </div>
            )}

            {!error && sesiones.length === 0 ? (
              <div className="text-center py-12 px-6 bg-black/5 rounded-2xl">
                <p className="font-semibold">Nadie ha agendado sesiones contigo aun.</p>
              </div>
            ) : (
              <ul className="space-y-6">
                {sesiones.map((s) => (
                  <SesionCardMentor key={s.id_sesion} sesion={s} />
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
  const fechaFormateada = new Date(s.fecha_hora_inicio_utc).toLocaleString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <li className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-white/10 transition-all">
      <div className="space-y-1">
        <p className="font-extrabold text-lg">{s.titulo_paquete}</p>
        <p className="text-sm font-semibold opacity-70">Alumno: {s.contraparte_nombre}</p>
        <p className="text-xs opacity-50">{fechaFormateada}</p>
      </div>

      {(s.estado_sesion === 'programada' || enCurso) && (
        <Link
          to={`/sesion/${s.id_sesion}`}
          className={`w-full sm:w-auto flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 ${
            enCurso ? 'bg-green-600' : 'bg-celeste'
          }`}
        >
          {enCurso ? 'Continuar llamada' : 'Iniciar llamada'}
        </Link>
      )}
    </li>
  );
}