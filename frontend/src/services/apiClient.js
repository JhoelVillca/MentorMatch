export async function apiClient(endpoint, customOptions = {}) {
  const options = {
    credentials: 'include',
    ...customOptions,
    headers: {
      'Content-Type': 'application/json',
      ...customOptions.headers,
    },
  };

  if (customOptions.body && typeof customOptions.body === 'object') {
    options.body = JSON.stringify(customOptions.body);
  }

  const response = await fetch(endpoint, options);

  if (response.status === 401) {
    window.location.href = '/login';
    throw new Error('Sesion expirada. Vuelve a ingresar.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Fallo de red en el servidor.');
  }

  return data;
}