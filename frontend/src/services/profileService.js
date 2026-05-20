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

  return data;
};

export const updateProfileAPI = async (profileData) => {
  const response = await fetch('/api/profiles/mentor/me', {
    method: 'PUT',
    headers: authJsonHeaders(),
    credentials: 'include',
    body: JSON.stringify(profileData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(parseErrorDetail(data));
  }

  return data;
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

  return data;
};

export const updateMenteeProfileAPI = async (profileData) => {
  const response = await fetch('/api/profiles/mentee/me', {
    method: 'PUT',
    headers: authJsonHeaders(),
    credentials: 'include',
    body: JSON.stringify(profileData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(parseErrorDetail(data));
  }

  return data;
};

// Legacy compatibility functions
export async function fetchMenteeProfile() {
  return getMenteeProfileAPI();
}

export async function saveMenteeProfile(profileData) {
  return updateMenteeProfileAPI(profileData);
}