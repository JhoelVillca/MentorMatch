export const loginAPI = async (email, password) => {
  const response = await fetch('/api/auth/login', {
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
    // Elevamos el error para que la vista decida que hacer con ella .-.
    throw new Error(data.detail || 'Credenciales malas. Intenta de nuevo.');
  }

  return data;
};