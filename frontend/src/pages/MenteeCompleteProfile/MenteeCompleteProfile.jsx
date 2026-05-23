import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { getMenteeProfileAPI, updateMenteeProfileAPI } from '../../services/profileService';
import { Camera, User } from 'lucide-react';

function buildTimezoneOptions() {
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
      return Intl.supportedValuesOf('timeZone').slice().sort();
    }
  } catch {
    /* ignore */
  }
  return [
    'UTC',
    'America/Asuncion',
    'America/La_Paz',
    'America/Bogota',
    'America/Lima',
    'America/Santiago',
    'America/Buenos_Aires',
    'Europe/Madrid',
  ];
}

export default function MenteeCompleteProfile() {
  const { token } = useAuth();
  const [timezoneOptions, setTimezoneOptions] = useState(buildTimezoneOptions);
  const [formData, setFormData] = useState({
    nombre_completo: '',
    zona_horaria_preferida: 'UTC',
    biografia_corta: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await getMenteeProfileAPI(token);
        if (isMounted) {
          const tz = data.zona_horaria_preferida || 'UTC';
          setTimezoneOptions((prev) => (prev.includes(tz) ? prev : [tz, ...prev]));
          setFormData({
            nombre_completo: data.nombre_completo || '',
            zona_horaria_preferida: tz,
            biografia_corta: data.biografia_corta || '',
            avatar_url: data.avatar_url || ''
          });
          setImageError(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error al cargar el perfil:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'avatar_url') {
      setImageError(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        nombre_completo: formData.nombre_completo,
        zona_horaria_preferida: formData.zona_horaria_preferida || 'UTC',
        biografia_corta: formData.biografia_corta || null,
        avatar_url: formData.avatar_url || ''
      };
      await updateMenteeProfileAPI(token, payload);
      setMessage({ type: 'success', text: '¡Perfil guardado correctamente!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Error al guardar el perfil' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-celeste" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 font-['Poppins']">
      <div className="bg-surface dark:bg-plomo-darkSurface rounded-2xl shadow-xl border border-plomo-100 dark:border-plomo-700/50 overflow-hidden transition-all duration-300">
        
        {/* Encabezado Celeste Plomo */}
        <div className="border-b border-plomo-100 dark:border-plomo-700/50 px-6 py-6 bg-plomo-50/50 dark:bg-plomo-800/20">
          <h1 className="text-2xl font-bold text-plomo-900 dark:text-white">Completar Perfil</h1>
          <p className="text-sm text-plomo-700 dark:text-plomo-100/60 mt-1">
            Indica tu nombre, avatar y zona horaria para organizar tus sesiones de mentoría.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-start text-sm font-medium border ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50'
                : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/50'
            }`}>
              <div className="ml-1">{message.text}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Círculo de Avatar para el Mentee (Añadido) */}
            <div className="flex flex-col items-center pb-6 border-b border-plomo-100 dark:border-plomo-700/50">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-celeste bg-plomo-50 dark:bg-plomo-darkCanvas flex items-center justify-center shadow-inner">
                {formData.avatar_url && !imageError ? (
                  <img
                    src={formData.avatar_url}
                    alt="Vista previa del avatar"
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <User className="h-16 w-16 text-plomo-700/50 dark:text-plomo-100/40" />
                )}
              </div>
              
              <div className="mt-4 w-full max-w-sm">
                <label htmlFor="avatar_url" className="block text-xs font-semibold text-plomo-700 dark:text-plomo-100/60 text-center uppercase tracking-wider mb-2">
                  Foto de Perfil (URL)
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Camera className="h-5 w-5 text-plomo-700/50 dark:text-plomo-100/40" aria-hidden="true" />
                  </div>
                  <input
                    type="url"
                    id="avatar_url"
                    name="avatar_url"
                    value={formData.avatar_url}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-plomo-100 dark:border-plomo-700 rounded-lg bg-background dark:bg-plomo-darkCanvas text-plomo-900 dark:text-white placeholder-plomo-700/40 dark:placeholder-plomo-100/30 focus:outline-none focus:ring-2 focus:ring-celeste focus:border-transparent sm:text-sm transition-all duration-200"
                    placeholder="https://ejemplo.com/tu-foto.jpg"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="nombre_completo" className="block text-sm font-semibold text-plomo-700 dark:text-plomo-100 mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                id="nombre_completo"
                name="nombre_completo"
                required
                value={formData.nombre_completo}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-plomo-100 dark:border-plomo-700 rounded-lg bg-background dark:bg-plomo-darkCanvas text-plomo-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-celeste focus:border-transparent sm:text-sm transition-all duration-200"
                placeholder="Ej. María García"
              />
            </div>

            <div>
              <label htmlFor="zona_horaria_preferida" className="block text-sm font-semibold text-plomo-700 dark:text-plomo-100 mb-1">
                Zona horaria
              </label>
              <select
                id="zona_horaria_preferida"
                name="zona_horaria_preferida"
                value={formData.zona_horaria_preferida}
                onChange={handleChange}
                className="block w-full px-4 py-2.5 border border-plomo-100 dark:border-plomo-700 rounded-lg bg-background dark:bg-plomo-darkCanvas text-plomo-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-celeste focus:border-transparent sm:text-sm transition-all duration-200"
              >
                {timezoneOptions.map((tz) => (
                  <option key={tz} value={tz} className="bg-surface dark:bg-plomo-darkSurface text-plomo-900 dark:text-white">
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="biografia_corta" className="block text-sm font-semibold text-plomo-700 dark:text-plomo-100 mb-1">
                Biografía corta
              </label>
              <textarea
                id="biografia_corta"
                name="biografia_corta"
                rows={5}
                value={formData.biografia_corta}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-plomo-100 dark:border-plomo-700 rounded-lg bg-background dark:bg-plomo-darkCanvas text-plomo-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-celeste focus:border-transparent sm:text-sm transition-all duration-200 resize-none"
                placeholder="Cuéntanos en pocas líneas qué te interesa aprender..."
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className={`px-8 py-3 rounded-lg font-bold text-white shadow-md transition-all duration-200 active:scale-95 ${
                  saving
                    ? 'bg-celeste/60 cursor-not-allowed'
                    : 'bg-celeste hover:bg-celeste-dark hover:shadow-lg'
                }`}
              >
                {saving ? 'Guardando...' : 'Guardar Perfil'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <p className="mt-6 text-center">
        <Link to="/mentee" className="text-celeste hover:text-celeste-dark text-sm font-medium transition-colors underline-offset-4 hover:underline">
          Volver al panel
        </Link>
      </p>
    </div>
  );
}