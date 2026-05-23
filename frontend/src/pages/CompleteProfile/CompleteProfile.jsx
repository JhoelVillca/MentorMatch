import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { getProfileAPI, updateProfileAPI } from '../../services/profileService';
import { Camera, User } from 'lucide-react';

export default function CompleteProfile() {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    nombre_completo: '',
    biografia_profesional: '',
    url_linkedin: '',
    url_video_presentacion: '',
    avatar_url: ''
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
          setFormData({
            nombre_completo: data.nombre_completo || '',
            biografia_profesional: data.biografia_profesional || '',
            url_linkedin: data.url_linkedin || '',
            url_video_presentacion: data.url_video_presentacion || '',
            avatar_url: data.avatar_url || ''
          });
          setImageError(false);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error.message || 'Error al cargar el perfil');
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
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'avatar_url') {
      setImageError(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    let isMounted = true;

    try {
      await updateProfileAPI(token, formData);
      if (isMounted) {
        setMessage({ type: 'success', text: '¡Perfil guardado correctamente!' });
      }
    } catch (error) {
      if (isMounted) {
        setMessage({ type: 'error', text: error.message || 'Error al guardar el perfil' });
      }
    } finally {
      if (isMounted) {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-celeste"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 font-['Poppins']">
      <div className="bg-surface dark:bg-plomo-darkSurface rounded-2xl shadow-xl border border-plomo-100 dark:border-plomo-700/50 overflow-hidden transition-all duration-300">
        
        {/* Encabezado con paleta Celeste Plomo */}
        <div className="border-b border-plomo-100 dark:border-plomo-700/50 px-6 py-6 bg-plomo-50/50 dark:bg-plomo-800/20">
          <h1 className="text-2xl font-bold text-plomo-900 dark:text-white">Perfil Profesional</h1>
          <p className="text-sm text-plomo-700 dark:text-plomo-100/60 mt-1">
            Completa tus datos para que los Mentees puedan conocerte mejor.
          </p>
        </div>
        
        <div className="p-6 sm:p-8">
          {loadError && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/50 font-medium text-sm">
              {loadError}
            </div>
          )}

          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-start text-sm font-medium border ${
              message.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50' 
                : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/50'
            }`}>
              <div className="flex-shrink-0 mt-0.5">
                {message.type === 'success' ? (
                  <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">{message.text}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Círculo del Avatar Adaptativo */}
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
                Nombre Completo
              </label>
              <input
                type="text"
                id="nombre_completo"
                name="nombre_completo"
                required
                value={formData.nombre_completo}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-plomo-100 dark:border-plomo-700 rounded-lg bg-background dark:bg-plomo-darkCanvas text-plomo-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-celeste focus:border-transparent sm:text-sm transition-all duration-200"
                placeholder="Ej. Juan Pérez"
              />
            </div>

            <div>
              <label htmlFor="biografia_profesional" className="block text-sm font-semibold text-plomo-700 dark:text-plomo-100 mb-1">
                Biografía Profesional
              </label>
              <textarea
                id="biografia_profesional"
                name="biografia_profesional"
                required
                rows="5"
                value={formData.biografia_profesional}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-plomo-100 dark:border-plomo-700 rounded-lg bg-background dark:bg-plomo-darkCanvas text-plomo-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-celeste focus:border-transparent sm:text-sm transition-all duration-200 resize-none"
                placeholder="Cuéntanos sobre tu experiencia, tu trayectoria..."
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="url_linkedin" className="block text-sm font-semibold text-plomo-700 dark:text-plomo-100 mb-1">
                  URL de LinkedIn
                </label>
                <input
                  type="url"
                  id="url_linkedin"
                  name="url_linkedin"
                  value={formData.url_linkedin}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-plomo-100 dark:border-plomo-700 rounded-lg bg-background dark:bg-plomo-darkCanvas text-plomo-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-celeste focus:border-transparent sm:text-sm transition-all duration-200"
                  placeholder="https://linkedin.com/in/tu-perfil"
                />
              </div>

              <div>
                <label htmlFor="url_video_presentacion" className="block text-sm font-semibold text-plomo-700 dark:text-plomo-100 mb-1">
                  Video de Presentación (Link)
                </label>
                <input
                  type="url"
                  id="url_video_presentacion"
                  name="url_video_presentacion"
                  value={formData.url_video_presentacion}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-plomo-100 dark:border-plomo-700 rounded-lg bg-background dark:bg-plomo-darkCanvas text-plomo-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-celeste focus:border-transparent sm:text-sm transition-all duration-200"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
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
    </div>
  );
}