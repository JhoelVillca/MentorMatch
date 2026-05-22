import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { getAllUsers, softDeleteUser, updateUserStatus } from "../../services/adminService";
import { 
  Users, 
  Package, 
  Check, 
  X, 
  Eye, 
  AlertCircle, 
  RefreshCw, 
  ShieldAlert 
} from "lucide-react";

const ESTADOS_VALIDOS = ["activo", "suspendido", "baneado", "inactivo"];

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Gestión de pestañas (Tabs): "users" | "packages"
  const [activeTab, setActiveTab] = useState("users");

  // Estado para usuarios
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [selectedEstado, setSelectedEstado] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Estado para paquetes (Mocks interactivos de validación de paquetes)
  const [packages, setPackages] = useState([
    {
      id_paquete: "p1",
      mentor: {
        nombre: "Jhoel Villca",
        email: "jhoel@mentormatch.com",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80"
      },
      titulo_paquete: "Desarrollo Web React 19 y Next.js Profesional",
      categoria: "Frontend",
      precio_total: 150.00,
      cantidad_horas_totales: 12,
      estado_validacion: "pendiente"
    },
    {
      id_paquete: "p2",
      mentor: {
        nombre: "María Gómez",
        email: "maria.g@mentormatch.com",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80"
      },
      titulo_paquete: "Microservicios Scalables con FastAPI y Docker",
      categoria: "Backend",
      precio_total: 220.00,
      cantidad_horas_totales: 15,
      estado_validacion: "aprobado"
    },
    {
      id_paquete: "p3",
      mentor: {
        nombre: "Carlos Pérez",
        email: "carlos.p@mentormatch.com",
        avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&h=80&q=80"
      },
      titulo_paquete: "Introducción Práctica a Machine Learning",
      categoria: "Inteligencia Artificial",
      precio_total: 350.00,
      cantidad_horas_totales: 20,
      estado_validacion: "rechazado"
    },
    {
      id_paquete: "p4",
      mentor: {
        nombre: "Laura Medina",
        email: "laura.m@mentormatch.com",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&h=80&q=80"
      },
      titulo_paquete: "Diseño UX/UI Avanzado en Figma y Prototipado",
      categoria: "Diseño UI/UX",
      precio_total: 180.00,
      cantidad_horas_totales: 10,
      estado_validacion: "pendiente"
    }
  ]);

  // Modal para detalle de paquete
  const [selectedPackageDetail, setSelectedPackageDetail] = useState(null);

  // Carga inicial de usuarios
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
    let isMounted = true;
    const fetchUsers = async () => {
      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }
        const data = await getAllUsers();
        if (isMounted) {
          setUsers(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          if (err.message.includes("401") || err.message.includes("403")) {
            logout();
            navigate("/login");
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, [logout, navigate]);

  // Acciones de usuarios
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
      showToast("Usuario suspendido correctamente.");
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
      showToast(`Estado de ${statusModal.email} cambiado a ${selectedEstado}.`);
    } catch (err) {
      setError(err.message);
    }
  };

  // Acciones de paquetes
  const handleApprovePackage = (id) => {
    setPackages(prev => 
      prev.map(p => p.id_paquete === id ? { ...p, estado_validacion: "aprobado" } : p)
    );
    showToast("El paquete ha sido aprobado correctamente.");
  };

  const handleRejectPackage = (id) => {
    setPackages(prev => 
      prev.map(p => p.id_paquete === id ? { ...p, estado_validacion: "rechazado" } : p)
    );
    showToast("El paquete ha sido rechazado.");
  };

  // Auxiliares
  const showToast = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 4000);
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
    if (roles.includes("admin")) {
      return "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900/50";
    }
    if (roles.includes("mentor")) {
      return "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50";
    }
    return "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/50";
  };

  const getRoleLabel = (roles) => {
    if (roles.includes("admin")) return "Administrador";
    if (roles.includes("mentor")) return "Mentor";
    return "Mentee";
  };

  const getStatusBadgeClass = (s) => {
    switch (s) {
      case "activo": 
        return "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50";
      case "suspendido": 
        return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50";
      case "baneado": 
        return "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50";
      default: 
        return "bg-slate-50 text-slate-650 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800";
    }
  };

  const getStatusLabel = (s) => {
    const map = { activo: "Activo", suspendido: "Suspendido", baneado: "Baneado", inactivo: "Inactivo" };
    return map[s] || s;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 font-['Poppins']">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Panel de Administración
          </h1>
          <p className="text-sm text-secondary-slate dark:text-slate-400 mt-1">
            Gestiona la moderación de cuentas de usuario y la aprobación de paquetes de mentoría.
          </p>
        </div>
        <button
          onClick={loadUsers}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button onClick={loadUsers} className="text-xs bg-rose-200 hover:bg-rose-350 px-3 py-1.5 rounded-lg text-rose-900 font-bold transition-all">
            Reintentar
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50 flex items-center gap-3">
          <Check className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {/* Pestañas (Tabs) Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 mb-6">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-4 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-all ${
              activeTab === "users"
                ? "border-primary-corporate text-primary-corporate dark:text-blue-400"
                : "border-transparent text-secondary-slate dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <Users className="w-4 h-4" />
            Gestión de Usuarios
          </button>

          <button
            onClick={() => setActiveTab("packages")}
            className={`pb-4 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-all ${
              activeTab === "packages"
                ? "border-primary-corporate text-primary-corporate dark:text-blue-400"
                : "border-transparent text-secondary-slate dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <Package className="w-4 h-4" />
            Validación de Paquetes
          </button>
        </nav>
      </div>

      {/* Contenido de la pestaña 1: Usuarios */}
      {activeTab === "users" && (
        <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-corporate border-t-transparent" />
              <p className="text-sm text-secondary-slate dark:text-slate-400 mt-2">Cargando cuentas de usuarios...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-secondary-slate dark:text-slate-400">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-secondary-slate dark:text-slate-400">
                      Rol
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-secondary-slate dark:text-slate-400">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-secondary-slate dark:text-slate-400">
                      Fecha de Registro
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-secondary-slate dark:text-slate-400">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-sm text-secondary-slate dark:text-slate-400">
                        No hay usuarios registrados.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr 
                        key={user.id_usuario} 
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeClass(user.roles)}`}>
                            {getRoleLabel(user.roles)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border ${getStatusBadgeClass(user.estado_cuenta)}`}>
                            {getStatusLabel(user.estado_cuenta)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-slate dark:text-slate-400">
                          {formatDate(user.fecha_creacion)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenStatusModal(user)}
                              className="px-3 py-1.5 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-semibold transition-colors"
                            >
                              Estado
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user.id_usuario)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-350 dark:hover:bg-rose-950/40 rounded text-xs font-semibold border border-rose-200 dark:border-rose-900/40 transition-colors"
                            >
                              Banear
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Contenido de la pestaña 2: Validación de Paquetes */}
      {activeTab === "packages" && (
        <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-secondary-slate dark:text-slate-400">
                    Usuario / Mentor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-secondary-slate dark:text-slate-400">
                    Nombre del Paquete
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-secondary-slate dark:text-slate-400">
                    Tipo / Categoría
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-secondary-slate dark:text-slate-400">
                    Precio
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-secondary-slate dark:text-slate-400">
                    Estado de Validación
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-secondary-slate dark:text-slate-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {packages.map((pkg) => (
                  <tr 
                    key={pkg.id_paquete} 
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    {/* Mentor profile */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-3">
                        <img 
                          className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" 
                          src={pkg.mentor.avatar} 
                          alt={pkg.mentor.nombre} 
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                            {pkg.mentor.nombre}
                          </span>
                          <span className="text-xs text-secondary-slate dark:text-slate-500">
                            {pkg.mentor.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Package Name */}
                    <td className="px-6 py-4 text-sm font-medium text-slate-850 dark:text-slate-200 max-w-xs truncate">
                      {pkg.titulo_paquete}
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-slate dark:text-slate-450">
                      {pkg.categoria}
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-slate-100">
                      ${pkg.precio_total.toFixed(2)} USD
                    </td>

                    {/* Validation state */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                        pkg.estado_validacion === "aprobado"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50"
                          : pkg.estado_validacion === "pendiente"
                          ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50"
                          : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50"
                      }`}>
                        {pkg.estado_validacion.charAt(0).toUpperCase() + pkg.estado_validacion.slice(1)}
                      </span>
                    </td>

                    {/* Package Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedPackageDetail(pkg)}
                          title="Ver detalle del paquete"
                          className="p-1.5 border border-slate-200 dark:border-slate-750 text-slate-750 dark:text-slate-300 rounded hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleApprovePackage(pkg.id_paquete)}
                          disabled={pkg.estado_validacion === "aprobado"}
                          title="Aprobar paquete"
                          className={`p-1.5 rounded border transition-colors ${
                            pkg.estado_validacion === "aprobado"
                              ? "opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400"
                              : "border-emerald-250 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-350 dark:border-emerald-900/40 dark:hover:bg-emerald-950/40"
                          }`}
                        >
                          <Check className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleRejectPackage(pkg.id_paquete)}
                          disabled={pkg.estado_validacion === "rechazado"}
                          title="Rechazar paquete"
                          className={`p-1.5 rounded border transition-colors ${
                            pkg.estado_validacion === "rechazado"
                              ? "opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400"
                              : "border-rose-250 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-355 dark:border-rose-900/40 dark:hover:bg-rose-950/40"
                          }`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Confirmar Baneo */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-slate-850 rounded-lg p-6 max-w-sm w-full shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-450 mb-3">
              <ShieldAlert className="w-6 h-6" />
              <h2 className="text-lg font-bold">Confirmar Baneo</h2>
            </div>
            <p className="text-sm text-secondary-slate dark:text-slate-450 mb-6 leading-relaxed">
              El usuario quedará suspendido y bloqueado en el sistema. Esta acción quedará registrada en los logs de auditoría administrativa.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 border border-slate-250 dark:border-slate-750 text-slate-700 dark:text-slate-350 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 font-semibold text-xs transition-colors"
                onClick={() => setConfirmDelete(null)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all"
                onClick={handleConfirmDelete}
              >
                Suspender
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Cambiar Estado de Cuenta */}
      {statusModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-slate-850 rounded-lg p-6 max-w-sm w-full shadow-2xl animate-in fade-in duration-200">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              Cambiar Estado de Cuenta
            </h2>
            <p className="text-xs text-secondary-slate dark:text-slate-400 mb-4">
              Afecta a la cuenta: <strong className="text-slate-800 dark:text-slate-305">{statusModal.email}</strong>
            </p>
            
            <div className="mb-6">
              <label className="block text-[10px] font-semibold text-secondary-slate dark:text-slate-450 uppercase tracking-wider mb-2">
                Seleccione el nuevo estado
              </label>
              <select
                value={selectedEstado}
                onChange={(e) => setSelectedEstado(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 dark:border-slate-750 rounded-lg bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-corporate/50 transition-all"
              >
                {ESTADOS_VALIDOS.map((e) => (
                  <option key={e} value={e}>
                    {getStatusLabel(e)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 border border-slate-250 dark:border-slate-750 text-slate-700 dark:text-slate-350 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 font-semibold text-xs transition-colors"
                onClick={() => setStatusModal(null)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-primary-corporate hover:bg-primary-corporate/90 text-white rounded-lg font-bold text-xs shadow-sm transition-all"
                onClick={handleConfirmStatus}
              >
                Aplicar Estado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Detalle del Paquete */}
      {selectedPackageDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-slate-850 rounded-lg p-6 max-w-md w-full shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Detalles de la Oferta
                </h3>
                <p className="text-xs text-secondary-slate dark:text-slate-450 mt-0.5">
                  ID: {selectedPackageDetail.id_paquete}
                </p>
              </div>
              <button 
                onClick={() => setSelectedPackageDetail(null)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="block text-[10px] font-semibold text-secondary-slate dark:text-slate-500 uppercase tracking-wider">
                  Mentor Propietario
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <img 
                    className="h-6 w-6 rounded-full object-cover" 
                    src={selectedPackageDetail.mentor.avatar} 
                    alt={selectedPackageDetail.mentor.nombre} 
                  />
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {selectedPackageDetail.mentor.nombre} ({selectedPackageDetail.mentor.email})
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-semibold text-secondary-slate dark:text-slate-500 uppercase tracking-wider">
                  Título del Paquete
                </span>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                  {selectedPackageDetail.titulo_paquete}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="block text-[10px] font-semibold text-secondary-slate dark:text-slate-500 uppercase tracking-wider">
                    Duración Estimada
                  </span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {selectedPackageDetail.cantidad_horas_totales} Horas
                  </p>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-secondary-slate dark:text-slate-500 uppercase tracking-wider">
                    Precio total
                  </span>
                  <p className="text-sm font-bold text-primary-corporate dark:text-blue-450">
                    ${selectedPackageDetail.precio_total.toFixed(2)} USD
                  </p>
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-semibold text-secondary-slate dark:text-slate-500 uppercase tracking-wider">
                  Categorización
                </span>
                <span className="inline-block mt-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 px-2.5 py-1 rounded font-semibold border border-slate-200 dark:border-slate-700">
                  {selectedPackageDetail.categoria}
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-semibold text-secondary-slate dark:text-slate-500 uppercase tracking-wider">
                  Estado Validación
                </span>
                <span className={`inline-block mt-1 text-xs px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider ${
                  selectedPackageDetail.estado_validacion === "aprobado"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50"
                    : selectedPackageDetail.estado_validacion === "pendiente"
                    ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50"
                    : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50"
                }`}>
                  {selectedPackageDetail.estado_validacion}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              {selectedPackageDetail.estado_validacion !== "aprobado" && (
                <button
                  onClick={() => {
                    handleApprovePackage(selectedPackageDetail.id_paquete);
                    setSelectedPackageDetail(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all"
                >
                  Aprobar
                </button>
              )}
              <button
                className="px-4 py-2 border border-slate-250 dark:border-slate-750 text-slate-750 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 font-semibold text-xs transition-colors"
                onClick={() => setSelectedPackageDetail(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}