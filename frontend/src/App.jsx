import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider } from './AuthContext'; 
import ProtectedRoute from './ProtectedRoute';
import Login from './pages/Login/Login';
import MentorDashboard from './pages/MentorDashboard/MentorDashboard';
import CompleteProfile from './pages/CompleteProfile/CompleteProfile';
import PaqueteCard from './components/PaqueteCard';
import NuevoPaqueteModal from './components/NuevoPaqueteModal';

const AdminDashboard = () => <h1 className="text-white text-center mt-10">Admin Dashboard</h1>;
const MenteeDashboard = () => <h1 className="text-white text-center mt-10">Mentee Dashboard</h1>;

const MisPaquetes = () => {
  const [paquetes, setPaquetes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cargarPaquetes = async () => {
    try {
      const resp = await fetch('http://localhost:8000/api/paquetes/me');
      const data = await resp.json();
      setPaquetes(data);
    } catch (err) {
      console.error("Error conectando con el backend:", err);
    }
  };

  useEffect(() => {
    cargarPaquetes();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="text-white">Mis Paquetes de Mentoría</h1>
      <button 
        onClick={() => setIsModalOpen(true)}
        style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }}
      >
        + Nuevo Paquete
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {paquetes.map(p => (
          <PaqueteCard key={p.id_paquete} paquete={p} onToggle={cargarPaquetes} />
        ))}
      </div>
      <NuevoPaqueteModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={cargarPaquetes} 
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['mentor', 'admin']} />}>
            <Route path="/mentor" element={<MentorDashboard />} />
            <Route path="/mentor/paquetes" element={<MisPaquetes />} />
            <Route path="/mentor/completar-perfil" element={<CompleteProfile />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['mentee', 'admin']} />}>
            <Route path="/mentee" element={<MenteeDashboard />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}