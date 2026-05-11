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

// Mentor profile APIs
export const getProfileAPI = async (token) => {
  const response = await fetch('/api/profiles/mentor/me', {
    headers: authJsonHeaders(token),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(parseErrorDetail(data));
  }

  return data;
};

export const updateProfileAPI = async (token, profileData) => {
  const response = await fetch('/api/profiles/mentor/me', {
    method: 'PUT',
    headers: authJsonHeaders(token),
    body: JSON.stringify(profileData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(parseErrorDetail(data));
  }

  return data;
};

// Mentee profile APIs
export const getMenteeProfileAPI = async (token) => {
  const response = await fetch('/api/profiles/mentee/me', {
    headers: authJsonHeaders(token),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(parseErrorDetail(data));
  }

  return data;
};

export const updateMenteeProfileAPI = async (token, profileData) => {
  const response = await fetch('/api/profiles/mentee/me', {
    method: 'PUT',
    headers: authJsonHeaders(token),
    body: JSON.stringify(profileData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(parseErrorDetail(data));
  }

  return data;
};

// Legacy compatibility functions
export async function fetchMenteeProfile(token) {
  return getMenteeProfileAPI(token);
}

export async function saveMenteeProfile(token, profileData) {
  return updateMenteeProfileAPI(token, profileData);
}