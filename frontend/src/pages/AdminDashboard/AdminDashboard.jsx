import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { getAllUsers, softDeleteUser, updateUserStatus, getPaquetesPendientes, validarPaquete } from "../../services/adminService";
import "./AdminDashboard.css";

const ESTADOS_VALIDOS = ["activo", "suspendido", "baneado", "inactivo"];

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("usuarios");
  const [users, setUsers] = useState([]);
  const [paquetes, setPaquetes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [selectedEstado, setSelectedEstado] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (activeTab === "usuarios") {
        const data = await getAllUsers();
        setUsers(data);
      } else {
        const data = await getPaquetesPendientes();
        setPaquetes(data);
      }
    } catch (err) {
      setError(err.message);
      if (err.message.includes("401") || err.message.includes("403")) {
        logout();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, logout, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleValidarPaquete = async (id, estado) => {
    try {
      await validarPaquete(id, estado);
      setPaquetes(prev => prev.filter(p => p.id_paquete !== id));
    } catch (err) {
      setError(err.message);
    }
  };

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
          <button onClick={loadData} className="btn-retry">Reintentar</button>
        </div>
      )}

      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <button 
          onClick={() => setActiveTab("usuarios")} 
          style={{ padding: "0.5rem 1rem", background: activeTab === "usuarios" ? "#6366f1" : "transparent", color: "white", border: "1px solid #6366f1", borderRadius: "0.375rem", cursor: "pointer" }}>
          Usuarios
        </button>
        <button 
          onClick={() => setActiveTab("paquetes")} 
          style={{ padding: "0.5rem 1rem", background: activeTab === "paquetes" ? "#6366f1" : "transparent", color: "white", border: "1px solid #6366f1", borderRadius: "0.375rem", cursor: "pointer" }}>
          Validacion Paquetes
        </button>
      </div>

      {activeTab === "usuarios" ? (
        <div className="users-table-container">
          <table className="users-table">
            <thead><tr><th>Email</th><th>Rol</th><th>Estado</th><th>Fecha Registro</th><th>Acciones</th></tr></thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id_usuario}>
                  <td className="email-cell">{user.email}</td>
                  <td>{user.roles.join(', ')}</td>
                  <td><span className={`status-badge status-${user.estado_cuenta}`}>{user.estado_cuenta}</span></td>
                  <td className="date-cell">{formatDate(user.fecha_creacion)}</td>
                  <td className="actions-cell" style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    <button className="btn-delete" style={{ borderColor: "#6366f1", color: "#6366f1" }} onClick={() => { setStatusModal(user); setSelectedEstado(user.estado_cuenta); }}>Estado</button>
                    <button className="btn-delete" onClick={() => setConfirmDelete(user.id_usuario)}>Banear</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead><tr><th>Titulo</th><th>Horas</th><th>Precio</th><th>Fecha</th><th>Acciones</th></tr></thead>
            <tbody>
              {paquetes.length === 0 ? <tr><td colSpan="5" style={{textAlign:"center", padding:"2rem"}}>No hay paquetes pendientes</td></tr> : paquetes.map(p => (
                <tr key={p.id_paquete}>
                  <td className="email-cell">{p.titulo_paquete}</td>
                  <td>{p.cantidad_horas_totales}</td>
                  <td>${p.precio_total}</td>
                  <td className="date-cell">{formatDate(p.fecha_creacion)}</td>
                  <td className="actions-cell" style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    <button className="btn-delete" style={{ borderColor: "#059669", color: "#059669" }} onClick={() => handleValidarPaquete(p.id_paquete, "aprobado")}>Aprobar</button>
                    <button className="btn-delete" onClick={() => handleValidarPaquete(p.id_paquete, "rechazado")}>Rechazar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals para confirmDelete y statusModal van aqui como en el original */}
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