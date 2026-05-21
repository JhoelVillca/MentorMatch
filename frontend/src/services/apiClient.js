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

  const response = await fetch(endpoint, options);

  if (response.status === 401) {
    window.location.href = '/login';
    throw new Error('Sesion expirada. Vuelve a ingresar.');
  }

  const data = await response.json().catch(() => ({}));

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