import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { fetchAdminUsers } from '../services/adminService';

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return '—';
  }
}

export default function AdminDashboard() {
  const { token, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) return;
      setError('');
      try {
        const data = await fetchAdminUsers(token);
        if (!cancelled) setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Error al cargar usuarios.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-[#080710] font-['Poppins'] text-white">
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold">Panel de administración</h1>
            <p className="text-white/70 text-sm mt-1">
              Usuarios registrados en la plataforma
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/login"
              onClick={() => logout()}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition-colors"
            >
              Cerrar sesión
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl overflow-hidden">
          {loading && (
            <p className="p-8 text-center text-white/80">Cargando usuarios…</p>
          )}
          {!loading && error && (
            <p className="p-8 text-center text-red-300 text-sm">{error}</p>
          )}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="px-4 py-3 font-semibold text-white/90">Email</th>
                    <th className="px-4 py-3 font-semibold text-white/90">Role</th>
                    <th className="px-4 py-3 font-semibold text-white/90">Status</th>
                    <th className="px-4 py-3 font-semibold text-white/90">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-white/60">
                        No hay usuarios registrados.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr
                        key={u.email}
                        className="border-b border-white/5 hover:bg-white/[0.04]"
                      >
                        <td className="px-4 py-3 text-white/95">{u.email}</td>
                        <td className="px-4 py-3 text-white/85 capitalize">{u.rol}</td>
                        <td className="px-4 py-3 text-white/85 capitalize">{u.estado_cuenta}</td>
                        <td className="px-4 py-3 text-white/75">{formatDate(u.fecha_creacion)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
