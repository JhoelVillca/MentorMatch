import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const [status, setStatus] = useState('loading');
  const [role, setRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('mentor_jwt');
    if (!token) {
      setStatus('unauthorized');
      return;
    }

    // Le preguntamos al backend quién demonios es el dueño de este token
    fetch('http://localhost:8000/users/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Token falso');
        return res.json();
      })
      .then(data => {
        setRole(data.role);
        setStatus('authorized');
      })
      .catch(() => {
        localStorage.removeItem('mentor_jwt');
        setStatus('unauthorized');
      });
  }, []);

  if (status === 'loading') {
    return <div className="min-h-screen bg-gray-950 flex justify-center items-center text-white">Escaneando retina...</div>;
  }

  if (status === 'unauthorized') {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    // Si tienes token pero no el rol correcto, te mandamos a tu nivel
    return <div className="min-h-screen bg-red-950 flex justify-center items-center text-white text-2xl font-bold">Error 403: No tienes nivel de acceso para esto. Largo.</div>;
  }

  return children;
}

