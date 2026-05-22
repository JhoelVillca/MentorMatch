import { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from './services/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    try {
      const data = await apiClient('/api/auth/me', { method: 'GET' });
      setUser({ id: data.id, role: data.rol });
      return data;
    } catch (error) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    localStorage.removeItem('mentor_token');
    
    checkSession();
  }, []);

  const login = async () => {
    return await checkSession();
  };

  const logout = async () => {
    try {
      await apiClient('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token: user, userRole: user?.role, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);