import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext'; 
import ProtectedRoute from './ProtectedRoute'; // Tu nueva arma
import Login from './pages/Login/Login';
import MentorSkillForm from './components/MentorSkillForm';

const AdminDashboard = () => <h1 className="text-white text-center mt-10">Admin Dashboard</h1>;
const MentorDashboard = () => (
  <div className="container mx-auto p-4">
    <h1 className="text-white text-center mt-10 text-3xl font-bold mb-8">Mentor Dashboard</h1>
    <MentorSkillForm />
  </div>
);
const MenteeDashboard = () => <h1 className="text-white text-center mt-10">Mentee Dashboard</h1>;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* publico */}
          <Route path="/login" element={<Login />} />

          {/* Admin */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Mentor */}
          <Route element={<ProtectedRoute allowedRoles={['mentor', 'admin']} />}>
            <Route path="/mentor" element={<MentorDashboard />} />
          </Route>

          {/* Mentee */}
          <Route element={<ProtectedRoute allowedRoles={['mentee', 'admin']} />}>
            <Route path="/mentee" element={<MenteeDashboard />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}