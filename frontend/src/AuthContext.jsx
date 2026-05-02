import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);

  // Esta función es la que llama tu Login.jsx cuando FastAPI responde con 200 OK
  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem('mentor_token', newToken); // Persistencia básica
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('mentor_token');
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);