import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { fetchMenteeProfile } from '../../services/profileService';
import './MenteeDashboard.css'; // Importación de los nuevos estilos

export default function MenteeDashboard() {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) return;
      setLoadError('');
      try {
        const data = await fetchMenteeProfile(token);
        if (!cancelled) setProfile(data);
      } catch (e) {
        if (!cancelled) setLoadError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  const tieneNombre = profile?.nombre_completo?.trim();

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>Panel del Alumno</h1>
          <p className="dashboard-subtitle">
            Resumen de cuenta y gestión de datos personales en Mentor Match.
          </p>
        </header>

        <div className="neon-card">
          {loading && <p className="loading-text">Sincronizando perfil con el servidor...</p>}
          
          {!loading && loadError && (
            <p className="text-red-500 text-center font-bold">Error: {loadError}</p>
          )}

          {!loading && !loadError && profile && (
            <dl className="space-y-6">
              <div>
                <dt className="data-label">Nombre completo</dt>
                <dd className="data-value">{tieneNombre ? profile.nombre_completo : '— Sin configurar —'}</dd>
              </div>
              
              <div>
                <dt className="data-label">Zona horaria preferida</dt>
                <dd className="data-value">{profile.zona_horaria_preferida || 'UTC'}</dd>
              </div>
              
              <div>
                <dt className="data-label">Biografía corta</dt>
                <dd className="bio-text">
                  {profile.biografia_corta?.trim() ? profile.biografia_corta : 'No has añadido una biografía todavía.'}
                </dd>
              </div>
            </dl>
          )}
        </div>

        <div className="flex justify-center">
          <Link
            to="/mentee/completar-perfil"
            className="btn-cyber-action"
          >
            {tieneNombre ? 'Editar Perfil' : 'Completar Perfil'}
          </Link>
        </div>
      </div>
    </div>
  );
}