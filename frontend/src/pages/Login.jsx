import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // El motor de salto hiperespacial de React Router
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
      // 1. Pedimos la llave
      const response = await fetch('http://localhost:8000/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Credenciales inválidas.');

      localStorage.setItem('mentor_jwt', data.access_token);

      // 2. Leemos la placa del usuario
      const profileResponse = await fetch('http://localhost:8000/users/me', {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      });
      const profileData = await profileResponse.json();
      if (!profileResponse.ok) throw new Error('Error al leer el perfil.');

      // 3. El Despachador: Te mandamos a tu zona correspondiente
      if (profileData.role === 'admin') {
        navigate('/admin');
      } else if (profileData.role === 'mentor') {
        navigate('/mentor');
      } else {
        navigate('/mentee');
      }

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-xl shadow-2xl p-8 border border-gray-800">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Mentor Match</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-800 text-white rounded-lg px-4 py-2" required />
          </div>
          <div>
            <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-800 text-white rounded-lg px-4 py-2" required />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Entrar a la Matrix</button>
        </form>
      </div>
    </div>
  );
}

export default Login;