import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { getMenteeProfileAPI, updateMenteeProfileAPI } from '../../services/profileService';

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
    'America/Mexico_City',
    'America/Bogota',
    'America/Lima',
    'America/Santiago',
    'America/Buenos_Aires',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/Madrid',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
  ];
}

export default function MenteeCompleteProfile() {
  const { token } = useAuth();
  const [timezoneOptions, setTimezoneOptions] = useState(buildTimezoneOptions);
  const [formData, setFormData] = useState({
    nombre_completo: '',
    zona_horaria_preferida: 'UTC',
    biografia_corta: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

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
          });
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-8">
          <h1 className="text-3xl font-bold text-white mb-2">Completar perfil</h1>
          <p className="text-emerald-100">
            Indica tu nombre, zona horaria y una breve biografía para organizar las sesiones.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-start ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <div className="ml-1 font-medium">{message.text}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="nombre_completo" className="block text-sm font-semibold text-gray-700 mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                id="nombre_completo"
                name="nombre_completo"
                required
                value={formData.nombre_completo}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-gray-50 focus:bg-white"
                placeholder="Ej. María García"
              />
            </div>

            <div>
              <label htmlFor="zona_horaria_preferida" className="block text-sm font-semibold text-gray-700 mb-1">
                Zona horaria
              </label>
              <select
                id="zona_horaria_preferida"
                name="zona_horaria_preferida"
                value={formData.zona_horaria_preferida}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 focus:bg-white"
              >
                {timezoneOptions.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="biografia_corta" className="block text-sm font-semibold text-gray-700 mb-1">
                Biografía corta
              </label>
              <textarea
                id="biografia_corta"
                name="biografia_corta"
                rows={5}
                value={formData.biografia_corta}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-gray-50 focus:bg-white resize-none"
                placeholder="Cuéntanos en pocas líneas qué te interesa aprender o en qué contexto buscas mentoría..."
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className={`px-8 py-3 rounded-lg font-bold text-white shadow-md transition-all ${
                  saving
                    ? 'bg-emerald-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 hover:shadow-lg'
                }`}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
