<<<<<<< HEAD
export default function CompleteProfile() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-white text-center mt-10 text-3xl font-bold mb-8">Completar Perfil de Mentor</h1>
      <p className="text-white text-center">Página en construcción...</p>
=======
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { getProfileAPI, updateProfileAPI } from '../../services/profileService';

export default function CompleteProfile() {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    nombre_completo: '',
    biografia_profesional: '',
    url_linkedin: '',
    url_video_presentacion: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await getProfileAPI(token);
        if (isMounted) {
          setFormData({
            nombre_completo: data.nombre_completo || '',
            biografia_profesional: data.biografia_profesional || '',
            url_linkedin: data.url_linkedin || '',
            url_video_presentacion: data.url_video_presentacion || ''
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
    setFormData(prev => ({ ...prev, [name]: value }));
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
    
    // Para el submit, no hay un cleanup fácil de retornar porque no es un useEffect,
    // pero evitamos errores asumiendo que await updateProfileAPI termina rápido
    // Si fuera muy estricto, se usaría un ref.
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
          <h1 className="text-3xl font-bold text-white mb-2">Perfil Profesional</h1>
          <p className="text-blue-100">Completa tus datos para que los Mentees puedan conocerte mejor.</p>
        </div>
        
        <div className="p-6 sm:p-8">
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-start ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              <div className="flex-shrink-0 mt-0.5">
                {message.type === 'success' ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3 font-medium">
                {message.text}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label htmlFor="nombre_completo" className="block text-sm font-semibold text-gray-700 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                id="nombre_completo"
                name="nombre_completo"
                required
                value={formData.nombre_completo}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
                placeholder="Ej. Juan Pérez"
              />
            </div>

            <div>
              <label htmlFor="biografia_profesional" className="block text-sm font-semibold text-gray-700 mb-1">
                Biografía Profesional
              </label>
              <textarea
                id="biografia_profesional"
                name="biografia_profesional"
                required
                rows="5"
                value={formData.biografia_profesional}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white resize-none"
                placeholder="Cuéntanos sobre tu experiencia, tu trayectoria y en qué te especializas..."
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="url_linkedin" className="block text-sm font-semibold text-gray-700 mb-1">
                  URL de LinkedIn
                </label>
                <input
                  type="url"
                  id="url_linkedin"
                  name="url_linkedin"
                  value={formData.url_linkedin}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
                  placeholder="https://linkedin.com/in/tu-perfil"
                />
              </div>

              <div>
                <label htmlFor="url_video_presentacion" className="block text-sm font-semibold text-gray-700 mb-1">
                  Video de Presentación (Link)
                </label>
                <input
                  type="url"
                  id="url_video_presentacion"
                  name="url_video_presentacion"
                  value={formData.url_video_presentacion}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className={`px-8 py-3 rounded-lg font-bold text-white shadow-md transition-all ${
                  saving 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95 hover:shadow-lg'
                }`}
              >
                {saving ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </span>
                ) : (
                  'Guardar Perfil'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
>>>>>>> 055f31dc62f2c10193fe28d8a7aa7072e6553723
    </div>
  );
}
