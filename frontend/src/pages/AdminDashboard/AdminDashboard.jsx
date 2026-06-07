import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { getAllUsers, softDeleteUser, updateUserStatus, getPaquetesPendientes, validarPaquete } from "../../services/adminService";
import { Users, Package, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle } from "lucide-react";

const ESTADOS_VALIDOS = ["activo", "suspendido", "baneado", "inactivo"];

const roleBadge = (roles) => {
  if (roles.includes("admin")) return "bg-violet-100 text-violet-700 border-violet-200";
  if (roles.includes("mentor")) return "bg-green-100 text-green-700 border-green-200";
  return "bg-blue-100 text-blue-700 border-blue-200";
};

const roleLabel = (roles) => {
  if (roles.includes("admin")) return "Admin";
  if (roles.includes("mentor")) return "Mentor";
  return "Mentee";
};

const statusBadge = (s) => {
  switch (s) {
    case "activo": return "bg-green-50 text-green-700 border-green-200";
    case "suspendido": return "bg-amber-50 text-amber-700 border-amber-200";
    case "baneado": return "bg-red-50 text-red-700 border-red-200";
    default: return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

const statusLabel = (s) => {
  const map = { activo: "Activo", suspendido: "Suspendido", baneado: "Baneado", inactivo: "Inactivo" };
  return map[s] || s;
};

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("es-ES", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

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

  useEffect(() => { loadData(); }, [loadData]);

  const handleValidarPaquete = async (id, estado) => {
    try {
      await validarPaquete(id, estado);
      setPaquetes(prev => prev.filter(p => p.id_paquete !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await softDeleteUser(confirmDelete);
      setUsers(prev => prev.map(u => u.id_usuario === confirmDelete ? { ...u, estado_cuenta: "baneado" } : u));
      setConfirmDelete(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConfirmStatus = async () => {
    if (!statusModal || selectedEstado === statusModal.estado_cuenta) {
      setStatusModal(null);
      return;
    }
    try {
      await updateUserStatus(statusModal.id_usuario, selectedEstado);
      setUsers(prev => prev.map(u => u.id_usuario === statusModal.id_usuario ? { ...u, estado_cuenta: selectedEstado } : u));
      setStatusModal(null);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-9 h-9 rounded-full border-2 border-slate-200 border-t-primary-600 animate-spin" />
        <p className="text-sm text-slate-500">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Panel de Administrador</h1>
        <p className="text-slate-500 mt-1">Gestión de usuarios y validación de paquetes.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-3 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="flex-shrink-0" />{error}
          </div>
          <button onClick={loadData} className="text-xs font-semibold underline underline-offset-2 hover:text-red-900 transition-colors">
            Reintentar
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("usuarios")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
            activeTab === "usuarios"
              ? "bg-primary-600 text-white border-primary-600 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Users size={14} />Usuarios
        </button>
        <button
          onClick={() => setActiveTab("paquetes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
            activeTab === "paquetes"
              ? "bg-primary-600 text-white border-primary-600 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Package size={14} />Validación Paquetes
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        {activeTab === "usuarios" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rol</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Registro</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(user => (
                  <tr key={user.id_usuario} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${roleBadge(user.roles)}`}>
                        {roleLabel(user.roles)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusBadge(user.estado_cuenta)}`}>
                        {statusLabel(user.estado_cuenta)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{formatDate(user.fecha_creacion)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setStatusModal(user); setSelectedEstado(user.estado_cuenta); }}
                          className="px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                        >
                          Estado
                        </button>
                        <button
                          onClick={() => setConfirmDelete(user.id_usuario)}
                          className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          Banear
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Título</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Horas</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Precio</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paquetes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-slate-400 py-12 text-sm">No hay paquetes pendientes.</td>
                  </tr>
                ) : paquetes.map(p => (
                  <tr key={p.id_paquete} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{p.titulo_paquete}</td>
                    <td className="px-6 py-4 text-slate-600">{p.cantidad_horas_totales}h</td>
                    <td className="px-6 py-4 text-slate-600">${p.precio_total}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{formatDate(p.fecha_creacion)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleValidarPaquete(p.id_paquete, "aprobado")}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-green-200 text-green-700 hover:bg-green-50 rounded-lg transition-all"
                        >
                          <CheckCircle size={12} />Aprobar
                        </button>
                        <button
                          onClick={() => handleValidarPaquete(p.id_paquete, "rechazado")}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <XCircle size={12} />Rechazar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-card-lg border border-slate-100 p-6 max-w-sm w-full">
            <h2 className="text-base font-bold text-slate-900 mb-2">Confirmar baneo</h2>
            <p className="text-sm text-slate-500 mb-5">El usuario quedará baneado. Esta acción queda registrada en auditoría.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                Cancelar
              </button>
              <button onClick={handleConfirmDelete} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all">
                Banear
              </button>
            </div>
          </div>
        </div>
      )}

      {statusModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-card-lg border border-slate-100 p-6 max-w-sm w-full">
            <h2 className="text-base font-bold text-slate-900 mb-1">Cambiar estado</h2>
            <p className="text-sm text-slate-500 mb-4">{statusModal.email}</p>
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all mb-5"
            >
              {ESTADOS_VALIDOS.map((e) => (
                <option key={e} value={e}>{statusLabel(e)}</option>
              ))}
            </select>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setStatusModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                Cancelar
              </button>
              <button onClick={handleConfirmStatus} className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all">
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
