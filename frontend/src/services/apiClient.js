const BASE_URL = import.meta.env.VITE_BACKEND_URL || '';
const MONITORING_ENDPOINT = import.meta.env.VITE_MONITORING_ENDPOINT || '';

const requestInterceptors = [];
const responseInterceptors = [];

const createAbortError = (message = 'La peticion fue cancelada.') => {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
};

const reportMonitoringEvent = async (event) => {
  const payload = {
    ...event,
    source: 'frontend.apiClient',
    timestamp: new Date().toISOString(),
  };

  if (!MONITORING_ENDPOINT) {
    console.error('[Monitoreo Frontend]', payload);
    return;
  }

  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(MONITORING_ENDPOINT, new Blob([body], { type: 'application/json' }));
    if (sent) return;
  }

  await fetch(MONITORING_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch((error) => {
    console.error('[Monitoreo Frontend] Error enviando evento', { payload, error: error?.message || String(error) });
  });
};

const composeAbortSignal = (externalSignal, timeoutMs) => {
  if (!externalSignal && !timeoutMs) {
    return { signal: undefined, cleanup: () => {} };
  }

  const controller = new AbortController();
  const abortFromExternal = () => controller.abort(externalSignal.reason || createAbortError());
  let timeoutId;

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason || createAbortError());
    } else {
      externalSignal.addEventListener('abort', abortFromExternal, { once: true });
    }
  }

  if (timeoutMs) {
    timeoutId = setTimeout(() => controller.abort(createAbortError('La peticion excedio el tiempo limite.')), timeoutMs);
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      if (externalSignal) {
        externalSignal.removeEventListener('abort', abortFromExternal);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    },
  };
};

export async function apiClient(endpoint, customOptions = {}) {
  console.log(`[Telemetria API] Iniciando peticion a: ${endpoint}`);

  const options = {
    credentials: 'include',
    ...customOptions,
    cache: customOptions.cache || 'default',
    headers: {
      'Content-Type': 'application/json',
      ...customOptions.headers,
    },
  };

  for (const interceptor of requestInterceptors) {
    await interceptor({ endpoint, options });
  }

  const isPlainObject =
    customOptions.body &&
    Object.prototype.toString.call(customOptions.body) === '[object Object]';

  if (isPlainObject) {
    options.body = JSON.stringify(customOptions.body);
  } else if (customOptions.body !== undefined) {
    options.body = customOptions.body;
  }

  let finalEndpoint = endpoint;
  if (BASE_URL && finalEndpoint.startsWith('/api')) {
    finalEndpoint = finalEndpoint.replace(/^\/api/, '');
  }

  const url = `${BASE_URL}${finalEndpoint}`;
  console.log(`[Telemetria API] URL resuelta: ${url}`);

  const { signal, cleanup } = composeAbortSignal(customOptions.signal, customOptions.timeoutMs);
  if (signal) {
    options.signal = signal;
  }

  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    cleanup();
    if (error?.name === 'AbortError') {
      throw error;
    }
    console.error('[Telemetria API] Error critico de red o bloqueo CORS:', error);
    await reportMonitoringEvent({
      type: 'api_client_error',
      endpoint,
      url,
      method: options.method || 'GET',
      cache: options.cache,
      errorName: error?.name || 'Error',
      errorMessage: error?.message || String(error),
    });
    throw new Error('Error de conexion con el servidor.');
  }

  cleanup();

  for (const interceptor of responseInterceptors) {
    await interceptor({ endpoint, options, response });
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
    await reportMonitoringEvent({
      type: 'api_client_error_response',
      endpoint,
      url,
      method: options.method || 'GET',
      status: response.status,
      cache: options.cache,
    });
    throw new Error(data.detail || 'Fallo de red en el servidor.');
  }

  return data;
}

export const apiClientInterceptors = {
  request: requestInterceptors,
  response: responseInterceptors,
};

export const logMonitoringEvent = reportMonitoringEvent;

