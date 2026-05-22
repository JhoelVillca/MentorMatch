function parseErrorDetail(data) {
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map((e) => e.msg || JSON.stringify(e)).join('. ');
  }
  return 'Error en la solicitud';
}

function authJsonHeaders() {
  return { 'Content-Type': 'application/json' };
}

// Mentor profile APIs
export const getProfileAPI = async () => {
  const response = await fetch('/api/profiles/mentor/me', {
    headers: authJsonHeaders(),
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(parseErrorDetail(data));
  }

  return {
    ...data,
    avatar_url: data.foto_perfil || ''
  };
};

export const updateProfileAPI = async (arg1, arg2) => {
  // Handle signature mismatch: updateProfileAPI(token, formData) vs updateProfileAPI(formData)
  const profileData = arg2 !== undefined ? arg2 : arg1;

  const payload = { ...profileData };
  if (payload.avatar_url !== undefined) {
    payload.foto_perfil = payload.avatar_url;
  }

  const response = await fetch('/api/profiles/mentor/me', {
    method: 'PUT',
    headers: authJsonHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(parseErrorDetail(data));
  }

  return {
    ...data,
    avatar_url: data.foto_perfil || ''
  };
};

// Mentee profile APIs
export const getMenteeProfileAPI = async () => {
  const response = await fetch('/api/profiles/mentee/me', {
    headers: authJsonHeaders(),
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(parseErrorDetail(data));
  }

  return {
    ...data,
    avatar_url: data.foto_perfil || ''
  };
};

export const updateMenteeProfileAPI = async (arg1, arg2) => {
  // Handle signature mismatch: updateMenteeProfileAPI(token, payload) vs updateMenteeProfileAPI(payload)
  const profileData = arg2 !== undefined ? arg2 : arg1;

  const payload = { ...profileData };
  if (payload.avatar_url !== undefined) {
    payload.foto_perfil = payload.avatar_url;
  }

  const response = await fetch('/api/profiles/mentee/me', {
    method: 'PUT',
    headers: authJsonHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(parseErrorDetail(data));
  }

  return {
    ...data,
    avatar_url: data.foto_perfil || ''
  };
};

// Legacy compatibility functions
export async function fetchMenteeProfile() {
  return getMenteeProfileAPI();
}

export async function saveMenteeProfile(profileData) {
  return updateMenteeProfileAPI(profileData);
}