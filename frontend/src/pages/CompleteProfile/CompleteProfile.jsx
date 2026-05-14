import './CompleteProfile.css'; // Importa el nuevo CSS

// ... dentro del componente ...

if (loading) {
  return (
    <div className="profile-container flex justify-center">
      <div className="spinner-neon"></div>
    </div>
  );
}

return (
  <div className="profile-container">
    <div className="profile-card">
      <div className="profile-header">
        <h1>Perfil Profesional</h1>
        <p>Completa tus datos para que los Mentees puedan conocerte mejor.</p>
      </div>
      
      <div className="profile-form-body">
        {/* Aquí puedes mantener el div del mensaje de error/éxito tal cual */}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-group">
            <label className="profile-label">Nombre Completo</label>
            <input
              type="text"
              name="nombre_completo"
              className="profile-input"
              value={formData.nombre_completo}
              onChange={handleChange}
              placeholder="Ej. Juan Pérez"
              required
            />
          </div>

          <div className="form-group">
            <label className="profile-label">Biografía Profesional</label>
            <textarea
              name="biografia_profesional"
              className="profile-textarea"
              value={formData.biografia_profesional}
              onChange={handleChange}
              placeholder="Cuéntanos sobre tu experiencia..."
              required
            />
          </div>

          <div className="profile-grid">
            <div className="form-group">
              <label className="profile-label">URL de LinkedIn</label>
              <input
                type="url"
                name="url_linkedin"
                className="profile-input"
                value={formData.url_linkedin}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="profile-label">Video de Presentación</label>
              <input
                type="url"
                name="url_video_presentacion"
                className="profile-input"
                value={formData.url_video_presentacion}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="btn-save-profile"
            >
              {saving ? 'Guardando...' : 'Guardar Perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);