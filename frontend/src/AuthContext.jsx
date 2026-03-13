import { createContext, useState, useEffect, useContext } from 'react';

// 1. Creamos el espacio en blanco (El Megáfono)
const AuthContext = createContext();

// 2. Creamos el Proveedor (El locutor que habla por el megáfono)
export const AuthProvider = ({ children }) => {
  // Inicializamos el estado leyendo el almacenamiento del navegador
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cada vez que el token cambie (o al cargar la página), buscamos los datos del usuario
  useEffect(() => {
    if (token) {
      // Usamos nuestro nuevo túnel '/api'
      fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.detail) {
          // Si el backend nos dice "Token inválido", cerramos sesión
          logout();
        } else {
          // Si nos da los datos, los guardamos
          setUser(data);
        }
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Creamos un Hook personalizado (El receptor de radio)
export const useAuth = () => useContext(AuthContext);

