<<<<<<< HEAD
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
=======
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
>>>>>>> 055f31dc62f2c10193fe28d8a7aa7072e6553723
    } finally {
      setSaving(false);
    }
  };

<<<<<<< HEAD
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
=======
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
>>>>>>> 055f31dc62f2c10193fe28d8a7aa7072e6553723
      </div>
    </div>
  );
}
