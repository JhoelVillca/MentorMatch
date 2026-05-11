import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('mentor_token'));

  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem('mentor_token', newToken);
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('mentor_token');
  };

  // Desensamblador del payload JWT
  let userRole = null;
  if (token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
      );
      userRole = JSON.parse(jsonPayload).rol;
    } catch (e) {
      console.error("Fallo de integridad en token JWT:", e);
      userRole = null;
    }
  }

  return (
    <AuthContext.Provider value={{ token, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);