import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext'; 
import { loginAPI } from '../../services/authService'; 
import styles from './Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginAPI(email, password);
      const userData = await login();

      if (userData) {
        if (userData.rol === 'admin') navigate('/admin');
        else if (userData.rol === 'mentor') navigate('/mentor');
        else navigate('/mentee');
      } else {
        setError('Error fatal al recuperar sesion.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080710] font-['Poppins'] text-white relative flex items-center justify-center overflow-hidden">
      <div className={styles.loginBackground}>
          <div className={`${styles.shape} ${styles.shape1}`}></div>
          <div className={`${styles.shape} ${styles.shape2}`}></div>
      </div>
      
      <form className={styles.glassForm} onSubmit={handleSubmit}>
          <h3>MentorMatch</h3>

          <label htmlFor="username">Correo Electronico</label>
          <input 
            type="email" 
            placeholder="Email" 
            id="username"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />

          <label htmlFor="password">Contrasena</label>
          <input 
            type="password" 
            placeholder="Password" 
            id="password"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />

          <button 
            type="submit" 
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesion'}
          </button>
          
          {error && (
            <div className="mt-5 text-[#ff512f] text-center text-sm font-semibold">
              {typeof error === 'object' ? JSON.stringify(error) : error}
            </div>
          )}
      </form>
    </div>
  );
}