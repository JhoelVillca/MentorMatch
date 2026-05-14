import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext'; 
import { loginAPI } from '../../services/authService'; 
import styles from './Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Consumimos el servicio de autenticación
      const data = await loginAPI(email, password);

      // Guardamos el token en el contexto
      login(data.access_token);
      
      // Redirección basada en el rol del usuario
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
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] font-['Poppins'] text-white relative flex items-center justify-center overflow-hidden">
      {/* Elementos decorativos neón de fondo */}
      <div className={styles.loginBackground}>
          <div className={`${styles.shape} ${styles.shape1}`}></div>
          <div className={`${styles.shape} ${styles.shape2}`}></div>
      </div>
      
      {/* Formulario con Glassmorphism */}
      <form className={styles.glassForm} onSubmit={handleSubmit}>
          <h3>MentorMatch</h3>

          <label htmlFor="username">Correo Electrónico</label>
          <input 
            type="email" 
            placeholder="usuario@u-mentor.com" 
            id="username"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            autoComplete="email"
          />

          <label htmlFor="password">Contraseña</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            id="password"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            autoComplete="current-password"
          />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
          
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
      </form>
    </div>
  );
}