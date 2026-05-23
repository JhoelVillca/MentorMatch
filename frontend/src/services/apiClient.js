const BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

export async function apiClient(endpoint, customOptions = {}) {
  const options = {
    credentials: 'include',
    ...customOptions,
    headers: {
      'Content-Type': 'application/json',
      ...customOptions.headers,
    },
  };

  if (
    customOptions.body && 
    typeof customOptions.body === 'object' && 
    !(customOptions.body instanceof URLSearchParams) &&
    !(customOptions.body instanceof FormData)
  ) {
    options.body = JSON.stringify(customOptions.body);
  } else if (customOptions.body) {
    options.body = customOptions.body;
  }

  let finalEndpoint = endpoint;
  if (BASE_URL && finalEndpoint.startsWith('/api')) {
    finalEndpoint = finalEndpoint.replace(/^\/api/, '');
  }

  const url = `${BASE_URL}${finalEndpoint}`;
  const response = await fetch(url, options);

  if (response.status === 401) {
    const path = window.location.pathname;
    if (path !== '/login' && path !== '/register') {
      window.location.href = '/login';
    }
    throw new Error('Sesion expirada o no iniciada.');
  }

  let data = {};
  try {
    data = await response.json();
  } catch (e) {
    data = {};
  }

  if (!response.ok) {
    let errorMessage = 'Fallo de red en el servidor.';
    
    if (Array.isArray(data.detail)) {
      errorMessage = data.detail.map(e => e.msg || 'Dato invalido').join('. ');
    } else if (typeof data.detail === 'string') {
      errorMessage = data.detail;
    } else if (data.message) {
      errorMessage = data.message;
    }

    throw new Error(errorMessage);
  }

  return data;
}