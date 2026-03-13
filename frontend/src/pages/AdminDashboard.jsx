import { useState, useEffect } from 'react';
import { Plus, Search, PenTool, Trash2, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: '', status: 'active' });
  const [error, setError] = useState('');
  
  const { token } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error de conexión con el servidor central.');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id, email) => {
    if (!window.confirm(`¿Está seguro de que desea eliminar permanentemente la cuenta de ${email}?`)) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error al intentar eliminar el registro.');
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({ name: user.full_name, email: user.email, role: user.role, status: 'active' });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', role: 'mentee', status: 'active' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#030305] text-gray-300 p-8 font-sans relative overflow-hidden selection:bg-indigo-500/30">
      
      {/* EFECTOS DE LUZ AMBIENTAL (LUXURY GLOW) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto mt-4 relative z-10">
        
        {/* ENCABEZADO */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-light text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 tracking-wide">
              Panel de Administración
            </h1>
          </div>
          <p className="text-gray-500 text-sm font-light tracking-wide">Gestión centralizada de usuarios de MentorMatch</p>
          {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
        </div>

        {/* BARRA DE HERRAMIENTAS */}
        <div className="flex justify-between items-center mb-8 gap-4">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] rounded-2xl px-4 pl-11 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300 placeholder-gray-600 shadow-inner backdrop-blur-md"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-white text-black px-6 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 hover:bg-gray-100 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            Nuevo Usuario
          </button>
        </div>

        {/* TABLA ESTILO CRISTAL (GLASSMORPHISM PREMIUM) */}
        <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05] text-[10px] font-semibold text-gray-500 tracking-[0.2em] uppercase bg-black/20">
                <th className="text-left px-8 py-6">Nombre Completo</th>
                <th className="text-left px-8 py-6">Correo Electrónico</th>
                <th className="text-left px-8 py-6">Nivel de Acceso</th>
                <th className="text-left px-8 py-6">Estado</th>
                <th className="text-right px-8 py-6">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, idx) => (
                <tr 
                  key={user.id} 
                  className={`group border-b border-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 ${idx === filteredUsers.length - 1 ? 'border-b-0' : ''}`}
                >
                  <td className="px-8 py-5 text-sm text-gray-200 font-light">{user.full_name}</td>
                  <td className="px-8 py-5 text-sm text-gray-500 font-light">{user.email}</td>
                  <td className="px-8 py-5 text-sm font-light">
                    <span className={`px-3 py-1.5 rounded-xl text-[11px] font-medium border backdrop-blur-md
                      ${user.role === 'admin' ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300' : 
                        user.role === 'mentor' ? 'border-blue-500/30 bg-blue-500/10 text-blue-300' : 
                        'border-gray-500/30 bg-gray-500/10 text-gray-400'}`}>
                      {user.role === 'admin' ? 'Administrador' : user.role === 'mentor' ? 'Mentor' : 'Estudiante'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm">
                    <span className="flex items-center gap-2 text-[12px] font-medium text-emerald-400">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Activo
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm">
                    <div className="flex justify-end gap-3 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all duration-200"
                        title="Modificar credenciales"
                      >
                        <PenTool className="w-[18px] h-[18px]" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.email)}
                        disabled={user.role === 'admin'}
                        className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all duration-200"
                        title="Revocar acceso"
                      >
                        <Trash2 className="w-[18px] h-[18px]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center text-gray-500 font-light text-sm">
                    No se encontraron usuarios en la matriz de datos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL DE EDICIÓN/CREACIÓN */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 z-50 transition-all">
            <div className="bg-[#0A0A0F] border border-white/[0.08] rounded-3xl w-full max-w-md shadow-[0_0_60px_rgba(0,0,0,0.5)] transform scale-100 overflow-hidden">
              <div className="flex justify-between items-center px-8 py-6 border-b border-white/[0.05] bg-white/[0.01]">
                <h2 className="text-lg font-light tracking-wide text-white">
                  {editingUser ? 'Modificar Usuario' : 'Registrar Nuevo Usuario'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form className="p-8 space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Falta implementar la ruta backend para crear/editar."); handleCloseModal(); }}>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-2.5 uppercase tracking-widest">Nombre Completo</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-black/20 border border-white/[0.05] hover:border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-black/40 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-2.5 uppercase tracking-widest">Correo Electrónico</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-black/20 border border-white/[0.05] hover:border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-black/40 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-2.5 uppercase tracking-widest">Nivel de Acceso</label>
                  <div className="relative">
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-black/20 border border-white/[0.05] hover:border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-black/40 appearance-none transition-all"
                    >
                      <option value="mentee" className="bg-[#0A0A0F]">Estudiante</option>
                      <option value="mentor" className="bg-[#0A0A0F]">Mentor</option>
                      <option value="admin" className="bg-[#0A0A0F]">Administrador</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div className="flex gap-4 pt-4 mt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 bg-transparent border border-white/10 px-4 py-3 rounded-xl text-sm font-medium hover:bg-white/5 text-gray-400 hover:text-white transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-white text-black px-4 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-[1.02] transition-all"
                  >
                    {editingUser ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}