import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Para cambiar de página
import { useAuth } from '../AuthContext'; // <--- Ojo a los dos puntos '../'

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate(); // El conductor del autobús

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // 1. El túnel secreto hacia FastAPI
      const response = await fetch('/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: email, // FastAPI manda: siempre se llama 'username' aquí
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Credenciales incorrectas. La Matrix te rechaza.');
      }

      // 2. Guardamos el token en el cerebro global
      login(data.access_token);
      
      // 3. Lo mandamos a la página principal o dashboard
      // (El AuthContext se encargará de descargar su perfil y saber su rol)
      navigate('/dashboard'); 

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <h2>Entrar a la Matrix</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Contraseña:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <button type="submit">Conectar</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}