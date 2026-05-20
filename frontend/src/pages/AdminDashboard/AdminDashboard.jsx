import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { getAllUsers, softDeleteUser, updateUserStatus } from "../../services/adminService";
import "./AdminDashboard.css";

const ESTADOS_VALIDOS = ["activo", "suspendido", "baneado", "inactivo"];

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [selectedEstado, setSelectedEstado] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
      if (err.message.includes("401") || err.message.includes("403")) {
        logout();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleDeleteClick = (userId) => setConfirmDelete(userId);

  const handleConfirmDelete = async () => {
    try {
      await softDeleteUser(confirmDelete);
      setUsers((prev) =>
        prev.map((u) =>
          u.id_usuario === confirmDelete ? { ...u, estado_cuenta: "baneado" } : u
        )
      );
      setConfirmDelete(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenStatusModal = (user) => {
    setStatusModal(user);
    setSelectedEstado(user.estado_cuenta);
  };

  const handleConfirmStatus = async () => {
    if (!statusModal || selectedEstado === statusModal.estado_cuenta) {
      setStatusModal(null);
      return;
    }
    try {
      await updateUserStatus(statusModal.id_usuario, selectedEstado);
      setUsers((prev) =>
        prev.map((u) =>
          u.id_usuario === statusModal.id_usuario
            ? { ...u, estado_cuenta: selectedEstado }
            : u
        )
      );
      setStatusModal(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getRoleBadgeClass = (roles) => {
    if (roles.includes("admin")) return "badge-admin";
    if (roles.includes("mentor")) return "badge-mentor";
    return "badge-mentee";
  };

  const getRoleLabel = (roles) => {
    if (roles.includes("admin")) return "Administrador";
    if (roles.includes("mentor")) return "Mentor";
    return "Mentee";
  };

  const getStatusBadgeClass = (s) => {
    switch (s) {
      case "activo": return "status-active";
      case "suspendido": return "status-suspended";
      case "baneado": return "status-banned";
      case "inactivo": return "status-unknown";
      default: return "status-unknown";
    }
  };

  const getStatusLabel = (s) => {
    const map = { activo: "Activo", suspendido: "Suspendido", baneado: "Baneado", inactivo: "Inactivo" };
    return map[s] || s;
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="spinner" />
          <p>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Panel de Administrador</h1>
        <p>Gestion de usuarios del sistema</p>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadUsers} className="btn-retry">Reintentar</button>
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
                <td colSpan="5" className="no-users">No hay usuarios registrados</td>
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
                  <td className="actions-cell" style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    <button
                      className="btn-delete"
                      style={{ background: "transparent", border: "1px solid #6366f1", color: "#6366f1" }}
                      onClick={() => handleOpenStatusModal(user)}
                    >
                      Estado
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteClick(user.id_usuario)}
                      title="Desactivar usuario"
                    >
                      Banear
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Confirmar baneo</h2>
            <p>El usuario quedara baneado. Esta accion queda registrada en auditoria.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn-confirm" onClick={handleConfirmDelete}>Banear</button>
            </div>
          </div>
        </div>
      )}

      {statusModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Cambiar estado de {statusModal.email}</h2>
            <p>Estado actual: <strong>{getStatusLabel(statusModal.estado_cuenta)}</strong></p>
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "0.375rem",
                background: "#0a0a0a",
                color: "white",
                border: "1px solid #374151",
                marginBottom: "1rem",
              }}
            >
              {ESTADOS_VALIDOS.map((e) => (
                <option key={e} value={e}>{getStatusLabel(e)}</option>
              ))}
            </select>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setStatusModal(null)}>Cancelar</button>
              <button className="btn-confirm" onClick={handleConfirmStatus}>Aplicar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}