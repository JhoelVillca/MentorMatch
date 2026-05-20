export const loginAPI = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: email, password: password }),
    credentials: 'include'
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Credenciales invalidas');
  }
  return true;
};

export const registerAPI = async (email, password, rol) => {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      rol,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Error al registrar usuario. Intenta de nuevo.');
  }

  return data;
};

