import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext'; 
import { loginAPI } from '../../services/authService'; // <-- Inyectamos el Músculo de red
import styles from './Login.module.css';

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
      //le mandamos al servicio
      const data = await loginAPI(email, password);

      login(data.access_token);
      
      switch(data.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'mentor':
          navigate('/mentor');
          break;
        case 'mentee':
        default:
          navigate('/mentee');
          break;
      }
    } catch (err) {
      setError(err.message);
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
            <div className="mt-5 text-[#ff512f] text-center text-sm font-semibold">
              {error}
            </div>
          )}
      </form>
    </div>
  );
}