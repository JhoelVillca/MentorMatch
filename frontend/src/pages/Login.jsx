import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Credenciales incorrectas. Por favor, inténtalo de nuevo.');
      }

      login(data.access_token);
      navigate('/dashboard'); 

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="login-background">
          <div className="shape"></div>
          <div className="shape"></div>
      </div>
      <form className="glass-form" onSubmit={handleSubmit}>
          <h3>MentorMatch</h3>

          <label htmlFor="username">Correo Electrónico</label>
          <input 
            type="email" 
            placeholder="Email" 
            id="username"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />

          <label htmlFor="password">Contraseña</label>
          <input 
            type="password" 
            placeholder="Password" 
            id="password"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />

          <button type="submit">Iniciar Sesión</button>
          
          {error && (
            <div style={{ marginTop: '20px', color: '#ff512f', textAlign: 'center', fontSize: '14px' }}>
              {error}
            </div>
          )}
      </form>
    </>
  );
}