import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { fetchMenteeProfile, saveMenteeProfile } from '../../services/profileService';

const TIMEZONES = [
  'UTC',
  'America/Mexico_City',
  'America/Bogota',
  'America/Lima',
  'America/Santiago',
  'America/Buenos_Aires',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'Europe/Madrid',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Dubai',
  'Australia/Sydney',
];

export default function MenteeCompleteProfile() {
  const { token } = useAuth();
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [zonaHoraria, setZonaHoraria] = useState('UTC');
  const [zoneOptions, setZoneOptions] = useState(TIMEZONES);
  const [biografia, setBiografia] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) return;
      setError('');
      try {
        const profile = await fetchMenteeProfile(token);
        if (cancelled) return;
        setNombreCompleto(profile.nombre_completo || '');
        const tz = profile.zona_horaria_preferida || 'UTC';
        if (!TIMEZONES.includes(tz)) {
          setZoneOptions([tz, ...TIMEZONES]);
        }
        setZonaHoraria(tz);
        setBiografia(profile.biografia_corta || '');
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await saveMenteeProfile(token, {
        nombre_completo: nombreCompleto,
        zona_horaria_preferida: zonaHoraria,
        biografia_corta: biografia.trim() ? biografia.trim() : null,
      });
      setSuccess('Perfil guardado correctamente.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080710] font-['Poppins'] text-white">
      <div className="container mx-auto max-w-lg px-4 py-12">
        <h1 className="text-center text-3xl font-bold mb-2">Completar perfil</h1>
        <p className="text-center text-white/70 text-sm mb-8">
          Configura tu nombre, zona horaria y una biografía breve para organizar sesiones en tu horario local.
        </p>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-xl">
          {loading ? (
            <p className="text-center text-white/80">Cargando perfil…</p>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-white/90 mb-1">
                  Nombre completo
                </label>
                <input
                  id="nombre"
                  type="text"
                  required
                  minLength={1}
                  maxLength={255}
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white placeholder-white/40 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label htmlFor="zona" className="block text-sm font-medium text-white/90 mb-1">
                  Zona horaria
                </label>
                <select
                  id="zona"
                  value={zonaHoraria}
                  onChange={(e) => setZonaHoraria(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {zoneOptions.map((tz) => (
                    <option key={tz} value={tz} className="bg-[#1a1a24]">
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-white/90 mb-1">
                  Biografía corta
                </label>
                <textarea
                  id="bio"
                  rows={5}
                  maxLength={4000}
                  value={biografia}
                  onChange={(e) => setBiografia(e.target.value)}
                  className="w-full resize-y rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white placeholder-white/40 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Cuéntanos en pocas líneas qué te gustaría aprender o en qué áreas buscas mentoría."
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/15 border border-red-500/40 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-lg bg-emerald-500/15 border border-emerald-500/40 px-3 py-2 text-sm text-emerald-200">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-600/50"
              >
                {saving ? 'Guardando…' : 'Guardar perfil'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center">
          <Link to="/mentee" className="text-blue-400 hover:text-blue-300 text-sm underline-offset-2 hover:underline">
            Volver al panel
          </Link>
        </p>
      </div>
    </div>
  );
}
