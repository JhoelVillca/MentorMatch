import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { getMenteeProfileAPI, updateMenteeProfileAPI } from '../../services/profileService';
import { Camera, User, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react';

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

const inputClass = 'w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all';

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
        if (isMounted) console.error('Error al cargar el perfil:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => { isMounted = false; };
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'avatar_url') setImageError(false);
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
        <div className="w-9 h-9 rounded-full border-2 border-slate-200 border-t-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Completar Perfil</h1>
        <p className="text-slate-500 mt-1">Indica tu nombre, avatar y zona horaria para organizar tus sesiones.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-7 space-y-6">
        {message && (
          <div className={`flex items-center gap-2 p-4 rounded-xl text-sm border ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle size={15} className="flex-shrink-0" /> : <AlertCircle size={15} className="flex-shrink-0" />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col items-center pb-6 border-b border-slate-100">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-50 flex items-center justify-center">
              {formData.avatar_url && !imageError ? (
                <img
                  src={formData.avatar_url}
                  alt="Vista previa del avatar"
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <User className="h-10 w-10 text-slate-300" />
              )}
            </div>
            <div className="mt-4 w-full max-w-sm">
              <label className="block text-xs font-medium text-slate-600 text-center mb-1.5">
                Foto de Perfil (URL)
              </label>
              <div className="relative">
                <Camera className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="url"
                  name="avatar_url"
                  value={formData.avatar_url}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="https://ejemplo.com/tu-foto.jpg"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Nombre completo</label>
            <input
              type="text"
              name="nombre_completo"
              required
              value={formData.nombre_completo}
              onChange={handleChange}
              className={inputClass}
              placeholder="Ej. María García"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Zona horaria</label>
            <select
              name="zona_horaria_preferida"
              value={formData.zona_horaria_preferida}
              onChange={handleChange}
              className={inputClass}
            >
              {timezoneOptions.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Biografía corta</label>
            <textarea
              name="biografia_corta"
              rows={5}
              value={formData.biografia_corta}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              placeholder="Cuéntanos en pocas líneas qué te interesa aprender..."
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-7 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-all active:scale-95"
            >
              {saving ? 'Guardando...' : 'Guardar Perfil'}
            </button>
          </div>
        </form>
      </div>

      <p className="mt-6 text-center">
        <Link to="/mentee" className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors">
          Volver al panel
        </Link>
      </p>
    </div>
  );
}
