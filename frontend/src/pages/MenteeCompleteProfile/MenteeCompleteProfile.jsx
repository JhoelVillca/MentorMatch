import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { getMenteeProfileAPI, updateMenteeProfileAPI } from '../../services/profileService';
import './MenteeCompleteProfile.css'; // Importación de estilos externos

function buildTimezoneOptions() {
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
      return Intl.supportedValuesOf('timeZone').slice().sort();
    }
  } catch { /* ignore */ }
  return [
    'UTC', 'America/La_Paz', 'America/Mexico_City', 'America/Bogota',
    'America/Lima', 'America/Santiago', 'America/Buenos_Aires',
    'Europe/Madrid'
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
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="spinner-neon" />
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h1>Completar Perfil</h1>
          <p>Indica tu información básica para organizar tus sesiones de mentoría.</p>
        </div>

        <div className="profile-form-body">
          {message && (
            <div className={`status-message ${message.type === 'success' ? 'status-success' : 'status-error'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="profile-label">Nombre completo</label>
              <input
                type="text"
                name="nombre_completo"
                required
                value={formData.nombre_completo}
                onChange={handleChange}
                className="profile-input"
                placeholder="Ej. Juan Pérez"
              />
            </div>

            <div className="form-group">
              <label className="profile-label">Zona horaria</label>
              <select
                name="zona_horaria_preferida"
                value={formData.zona_horaria_preferida}
                onChange={handleChange}
                className="profile-select"
              >
                {timezoneOptions.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="profile-label">Biografía corta</label>
              <textarea
                name="biografia_corta"
                value={formData.biografia_corta}
                onChange={handleChange}
                className="profile-textarea"
                placeholder="Cuéntanos sobre tus intereses académicos o metas..."
              />
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" disabled={saving} className="btn-save-mentee">
                {saving ? 'Guardando...' : 'Guardar Perfil'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <p className="mt-6 text-center">
        <Link to="/mentee" className="text-gray-400 hover:text-red-500 text-sm transition-colors">
          &larr; Volver al panel de Mentee
        </Link>
      </p>
    </div>
  );
}