<<<<<<< HEAD
function parseErrorDetail(data) {
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map((e) => e.msg || JSON.stringify(e)).join('. ');
  }
  return 'Error en la solicitud';
}

function authJsonHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchMenteeProfile(token) {
  const response = await fetch('/api/profiles/mentee/me', {
    headers: authJsonHeaders(token),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(parseErrorDetail(data));
  }
  return data;
}

export async function saveMenteeProfile(token, { nombre_completo, zona_horaria_preferida, biografia_corta }) {
  const response = await fetch('/api/profiles/mentee/me', {
    method: 'PUT',
    headers: authJsonHeaders(token),
    body: JSON.stringify({
      nombre_completo,
      zona_horaria_preferida: zona_horaria_preferida || 'UTC',
      biografia_corta: biografia_corta || null,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(parseErrorDetail(data));
  }
  return data;
}
=======
export const getProfileAPI = async (token) => {
  const response = await fetch('/api/profiles/mentor/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Error al obtener el perfil');
  }

  return data;
};

export const updateProfileAPI = async (token, profileData) => {
  const response = await fetch('/api/profiles/mentor/me', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Error al actualizar el perfil');
  }

  return data;
};

export const getMenteeProfileAPI = async (token) => {
  const response = await fetch('/api/profiles/mentee/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Error al obtener el perfil');
  }

  return data;
};

export const updateMenteeProfileAPI = async (token, profileData) => {
  const response = await fetch('/api/profiles/mentee/me', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Error al actualizar el perfil');
  }

  return data;
};
>>>>>>> 055f31dc62f2c10193fe28d8a7aa7072e6553723
