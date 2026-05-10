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
