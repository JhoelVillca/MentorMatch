import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { fetchMenteeProfile } from '../../services/profileService';
import { apiClient } from '../../services/apiClient';

export default function MenteeDashboard() {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [sesiones, setSesiones] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      if (!token) return;
      setLoadError('');
      try {
        const [profileData, sesionesData] = await Promise.all([
          fetchMenteeProfile(token),
          apiClient('/api/sesiones/mentee/me', { method: 'GET' })
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

  const tieneNombre = profile?.nombre_completo?.trim();

  return (
    <div className="min-h-screen bg-[#080710] font-['Poppins'] text-white">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-center text-3xl font-bold mb-2">Panel del alumno</h1>
        
        {loading && <p className="text-white/80 text-center">Cargando datos del panel…</p>}
        {!loading && loadError && <p className="text-red-300 text-center text-sm">{loadError}</p>}
        
        {!loading && !loadError && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl h-fit">
              <h2 className="text-xl font-bold border-b border-white/10 pb-2 mb-4">Tu Perfil</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-white/50">Nombre</dt>
                  <dd className="text-lg mt-0.5">{tieneNombre ? profile.nombre_completo : 'No configurado'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-white/50">Zona horaria</dt>
                  <dd className="text-lg mt-0.5">{profile.zona_horaria_preferida || 'UTC'}</dd>
                </div>
              </dl>
              <div className="mt-6">
                <Link to="/mentee/completar-perfil" className="inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-500 transition">
                  {tieneNombre ? 'Editar perfil' : 'Completar perfil'}
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
              <h2 className="text-xl font-bold border-b border-white/10 pb-2 mb-4">Proximas Sesiones</h2>
              {sesiones.length === 0 ? (
                <p className="text-gray-400 text-sm">No tienes sesiones agendadas.</p>
              ) : (
                <ul className="space-y-4">
                  {sesiones.map(s => (
                    <li key={s.id_sesion} className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
                      <p className="font-semibold text-red-400">{s.titulo_paquete}</p>
                      <p className="text-sm">Mentor: {s.contraparte_nombre}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(s.fecha_hora_inicio_utc).toLocaleString()} - Estado: {s.estado_sesion}
                      </p>
                    </li>
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