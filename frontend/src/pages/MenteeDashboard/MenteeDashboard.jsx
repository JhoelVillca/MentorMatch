import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { fetchMenteeProfile } from '../../services/profileService';

export default function MenteeDashboard() {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) return;
      setLoadError('');
      try {
        const data = await fetchMenteeProfile(token);
        if (!cancelled) setProfile(data);
      } catch (e) {
        if (!cancelled) setLoadError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const tieneNombre = profile?.nombre_completo?.trim();

  return (
    <div className="min-h-screen bg-[#080710] font-['Poppins'] text-white">
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-center text-3xl font-bold mb-2">Panel del alumno</h1>
        <p className="text-center text-white/70 text-sm mb-10">
          Aquí verás el resumen de tu cuenta y podrás actualizar tus datos personales.
        </p>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-xl mb-8">
          {loading && <p className="text-white/80 text-center">Cargando tu perfil…</p>}
          {!loading && loadError && (
            <p className="text-red-300 text-center text-sm">{loadError}</p>
          )}
          {!loading && !loadError && profile && (
            <dl className="space-y-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/50">Nombre completo</dt>
                <dd className="text-lg mt-0.5">{tieneNombre ? profile.nombre_completo : '— Aún no configurado —'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/50">Zona horaria preferida</dt>
                <dd className="text-lg mt-0.5">{profile.zona_horaria_preferida || 'UTC'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/50">Biografía corta</dt>
                <dd className="text-white/90 mt-0.5 whitespace-pre-wrap">
                  {profile.biografia_corta?.trim() ? profile.biografia_corta : '— Sin biografía —'}
                </dd>
              </div>
            </dl>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/mentee/completar-perfil"
            className="inline-flex justify-center rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-500 transition"
          >
            {tieneNombre ? 'Editar perfil' : 'Completar perfil'}
          </Link>
        </div>
      </div>
    </div>
  );
}
