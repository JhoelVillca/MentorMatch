import { apiClient } from './apiClient';

// Mentor profile APIs
export const getProfileAPI = async () => {
  const data = await apiClient('/api/profiles/mentor/me', { method: 'GET' });

  return {
    ...data,
    avatar_url: data.foto_perfil || ''
  };
};

export const updateProfileAPI = async (arg1, arg2) => {
  const profileData = arg2 !== undefined ? arg2 : arg1;

  const payload = { ...profileData };
  if (payload.avatar_url !== undefined) {
    payload.foto_perfil = payload.avatar_url;
  }

  const data = await apiClient('/api/profiles/mentor/me', { method: 'PUT', body: payload });

  return {
    ...data,
    avatar_url: data.foto_perfil || ''
  };
};

// Mentee profile APIs
export const getMenteeProfileAPI = async () => {
  const data = await apiClient('/api/profiles/mentee/me', { method: 'GET' });

  return {
    ...data,
    avatar_url: data.foto_perfil || ''
  };
};

export const updateMenteeProfileAPI = async (arg1, arg2) => {
  const profileData = arg2 !== undefined ? arg2 : arg1;

  const payload = { ...profileData };
  if (payload.avatar_url !== undefined) {
    payload.foto_perfil = payload.avatar_url;
  }

  const data = await apiClient('/api/profiles/mentee/me', { method: 'PUT', body: payload });

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