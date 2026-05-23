const BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

export async function apiClient(endpoint, customOptions = {}) {
  console.log(`[Telemetria API] Iniciando peticion a: ${endpoint}`);
  
  const options = {
    credentials: 'include',
    ...customOptions,
    headers: {
      'Content-Type': 'application/json',
      ...customOptions.headers,
    },
  };

  const isPlainObject =
    customOptions.body &&
    Object.prototype.toString.call(customOptions.body) === '[object Object]';

  if (isPlainObject) {
    options.body = JSON.stringify(customOptions.body);
  } else if (customOptions.body !== undefined) {
    options.body = customOptions.body;
  }

  let finalEndpoint = endpoint;
  // Purgar prefijo /api en produccion
  if (BASE_URL && finalEndpoint.startsWith('/api')) {
    finalEndpoint = finalEndpoint.replace(/^\/api/, '');
  }
  
  const url = `${BASE_URL}${finalEndpoint}`;
  console.log(`[Telemetria API] URL resuelta: ${url}`);
  
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    console.error('[Telemetria API] Error critico de red o bloqueo CORS:', error);
    throw new Error('Error de conexion con el servidor.');
  }

  if (response.status === 401) {
    console.warn('[Telemetria API] El backend respondio 401. Delegando a React Router.');
    throw new Error('Sesion expirada o no iniciada.');
  }

  let data = {};
  try {
    data = await response.json();
  } catch (e) {
    console.warn('[Telemetria API] La respuesta no es JSON valido', e);
  }

  if (!response.ok) {
    console.error(`[Telemetria API] Servidor respondio con estado ${response.status}`);
    throw new Error(data.detail || 'Fallo de red en el servidor.');
  }

  return data;
}