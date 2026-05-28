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
  } catch { /* ignore */ }
  return [
    'UTC', 'America/Asuncion', 'America/La_Paz', 'America/Bogota', 
    'America/Lima', 'America/Santiago', 'America/Buenos_Aires', 'Europe/Madrid',
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
        console.error('Error al cargar el perfil:', error);
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
      <div className="flex justify-center items-center min-h-screen text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed p-4 sm:p-8 font-['Poppins'] text-white"
         style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}>
      
      {/* Contenedor Glassmorphism */}
      <div className="max-w-2xl mx-auto rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300">
        
        <div className="px-6 py-8 border-b border-white/10 bg-black/10">
          <h1 className="text-3xl font-extrabold text-white">Completar Perfil</h1>
          <p className="text-sm text-white/60 mt-2">
            Indica tu información personal para organizar tus sesiones de mentoría.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {message && (
            <div className={`mb-6 p-4 rounded-xl flex items-start text-sm font-medium border ${
              message.type === 'success' ? 'bg-green-500/20 text-green-100 border-green-500/30' : 'bg-red-500/20 text-red-100 border-red-500/30'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Avatar Section */}
            <div className="flex flex-col items-center pb-6 border-b border-white/10">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 bg-black/20 flex items-center justify-center shadow-inner">
                {formData.avatar_url && !imageError ? (
                  <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" onError={() => setImageError(true)} />
                ) : (
                  <User className="h-16 w-16 text-white/30" />
                )}
              </div>
              
              <div className="mt-4 w-full max-w-sm">
                <label htmlFor="avatar_url" className="block text-xs font-semibold text-white/60 text-center uppercase tracking-wider mb-2">
                  Foto de Perfil (URL)
                </label>
                <div className="relative">
                  <Camera className="absolute left-3 top-3 h-5 w-5 text-white/30" />
                  <input
                    type="url" id="avatar_url" name="avatar_url" value={formData.avatar_url} onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-black/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                    placeholder="https://ejemplo.com/tu-foto.jpg"
                  />
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Nombre completo</label>
              <input
                type="text" name="nombre_completo" required value={formData.nombre_completo} onChange={handleChange}
                className="w-full px-4 py-3 border border-white/10 rounded-xl bg-black/20 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                placeholder="Ej. María García"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Zona horaria</label>
              <select
                name="zona_horaria_preferida" value={formData.zona_horaria_preferida} onChange={handleChange}
                className="w-full px-4 py-3 border border-white/10 rounded-xl bg-black/20 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
              >
                {timezoneOptions.map((tz) => (
                  <option key={tz} value={tz} className="bg-gray-900 text-white">
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Biografía corta</label>
              <textarea
                name="biografia_corta" rows={4} value={formData.biografia_corta} onChange={handleChange}
                className="w-full px-4 py-3 border border-white/10 rounded-xl bg-black/20 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all resize-none"
                placeholder="Cuéntanos un poco sobre ti..."
              />
            </div>

            <button
              type="submit" disabled={saving}
              className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-[0.98] ${
                saving ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-pink-600 to-violet-600 hover:opacity-90'
              }`}
            >
              {saving ? 'Guardando...' : 'Guardar Perfil'}
            </button>
          </form>
        </div>
      </div>

      <p className="mt-6 text-center">
        <Link to="/mentee" className="text-white/60 hover:text-white text-sm font-medium transition-colors underline-offset-4 hover:underline">
          Volver al panel
        </Link>
      </p>
    </div>
  );
}