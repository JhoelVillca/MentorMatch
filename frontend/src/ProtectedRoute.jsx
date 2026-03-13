import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  // Si el cerebro todavía está pensando, esperamos.
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex justify-center items-center text-white">
        Escaneando retina...
      </div>
    );
  }

  // Si no hay usuario (no está logueado), a la calle.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si está logueado, pero su rol no está en la lista permitida, le damos una bofetada.
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-red-950 flex justify-center items-center text-white text-2xl font-bold">
        Error 403: Tu rol de '{user.role}' no tiene nivel de acceso para esto. Largo de aquí.
      </div>
    );
  }

  // Si pasa todas las pruebas, lo dejamos entrar a la página (children).
  return children;
}