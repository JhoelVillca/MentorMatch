import { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { getProfileAPI, updateProfileAPI } from '../../services/profileService';
import { Camera, User, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react';
import AvatarUploader from '../../components/AvatarUploader';

function buildTimezoneOptions() {
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
      return Intl.supportedValuesOf('timeZone').slice().sort();
    }
  } catch {
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

export default function CompleteProfile() {
  const { token } = useAuth();
  const [timezoneOptions, setTimezoneOptions] = useState(buildTimezoneOptions);
  const [formData, setFormData] = useState({
    nombre_completo: '',
    biografia_profesional: '',
    url_linkedin: '',
    url_video_presentacion: '',
    avatar_url: '',
    zona_horaria_preferida: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [message, setMessage] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const data = await getProfileAPI(token);
        if (isMounted) {
          const tz = data.zona_horaria_preferida || Intl.DateTimeFormat().resolvedOptions().timeZone;
          setTimezoneOptions((prev) => (prev.includes(tz) ? prev : [tz, ...prev]));
          setFormData({
            nombre_completo: data.nombre_completo || '',
            biografia_profesional: data.biografia_profesional || '',
            url_linkedin: data.url_linkedin || '',
            url_video_presentacion: data.url_video_presentacion || '',
            avatar_url: data.avatar_url || '',
            zona_horaria_preferida: tz
          });
          setImageError(false);
        }
      } catch (error) {
        if (isMounted) setLoadError(error.message || 'Error al cargar el perfil');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => { isMounted = false; };
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'avatar_url') setImageError(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    let isMounted = true;
    try {
      await updateProfileAPI(token, formData);
      if (isMounted) setMessage({ type: 'success', text: '¡Perfil guardado correctamente!' });
    } catch (error) {
      if (isMounted) setMessage({ type: 'error', text: error.message || 'Error al guardar el perfil' });
    } finally {
      if (isMounted) setSaving(false);
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
        <h1 className="text-2xl font-bold text-slate-900">Perfil Profesional</h1>
        <p className="text-slate-500 mt-1">Completa tus datos para que los Mentees puedan conocerte mejor.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-7 space-y-6">
        {loadError && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            <AlertCircle size={15} className="flex-shrink-0" />{loadError}
          </div>
        )}

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
          <div className="mb-6 flex flex-col items-center">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Foto de Perfil
            </label>
            <AvatarUploader 
              role="mentor" 
              currentAvatar={formData.avatar_url} 
              onUploadSuccess={(nuevaUrl) => {
                setFormData(prev => ({ ...prev, avatar_url: nuevaUrl }));
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Nombre Completo</label>
            <input
              type="text"
              name="nombre_completo"
              required
              value={formData.nombre_completo}
              onChange={handleChange}
              className={inputClass}
              placeholder="Ej. Juan Pérez"
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
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Biografía Profesional</label>
            <textarea
              name="biografia_profesional"
              required
              rows="5"
              value={formData.biografia_profesional}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              placeholder="Cuéntanos sobre tu experiencia y trayectoria..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">URL de LinkedIn</label>
              <input
                type="url"
                name="url_linkedin"
                value={formData.url_linkedin}
                onChange={handleChange}
                className={inputClass}
                placeholder="https://linkedin.com/in/tu-perfil"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Video de Presentación</label>
              <input
                type="url"
                name="url_video_presentacion"
                value={formData.url_video_presentacion}
                onChange={handleChange}
                className={inputClass}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
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
    </div>
  );
}
