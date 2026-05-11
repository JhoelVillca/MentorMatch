import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { getAllUsers, deleteUser } from '../../services/adminService';
import './AdminDashboard.css';

/**
 * Panel de control del Administrador
 * Muestra una tabla con todos los usuarios registrados en el sistema
 */
export default function AdminDashboard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllUsers(token);
      setUsers(data);
    } catch (err) {
      setError(err.message);
      // Si es un error 401 o 403, cerrar sesión
      if (err.message.includes('401') || err.message.includes('403')) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [token, logout, navigate]);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleDeleteClick = (userId) => {
    setConfirmDelete(userId);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteUser(token, confirmDelete);
      setUsers(users.filter(user => user.id_usuario !== confirmDelete));
      setConfirmDelete(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeClass = (roles) => {
    if (roles.includes('admin')) return 'badge-admin';
    if (roles.includes('mentor')) return 'badge-mentor';
    return 'badge-mentee';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'activo':
        return 'status-active';
      case 'suspendido':
        return 'status-suspended';
      case 'baneado':
        return 'status-banned';
      default:
        return 'status-unknown';
    }
  };

  const getRoleLabel = (roles) => {
    if (roles.includes('admin')) return 'Administrador';
    if (roles.includes('mentor')) return 'Mentor';
    return 'Mentee';
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'activo':
        return 'Activo';
      case 'suspendido':
        return 'Suspendido';
      case 'baneado':
        return 'Baneado';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Panel de Administrador</h1>
        <p>Gestión de usuarios del sistema</p>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadUsers} className="btn-retry">
            Reintentar
          </button>
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Fecha de Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-users">
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id_usuario}>
                  <td className="email-cell">{user.email}</td>
                  <td>
                    <span className={`badge ${getRoleBadgeClass(user.roles)}`}>
                      {getRoleLabel(user.roles)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(user.estado_cuenta)}`}>
                      {getStatusLabel(user.estado_cuenta)}
                    </span>
                  </td>
                  <td className="date-cell">{formatDate(user.fecha_creacion)}</td>
                  <td className="actions-cell">
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteClick(user.id_usuario)}
                      title="Eliminar usuario"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de confirmación de eliminación */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Confirmar eliminación</h2>
            <p>¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={handleCancelDelete}>
                Cancelar
              </button>
              <button className="btn-confirm" onClick={handleConfirmDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}