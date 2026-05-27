import { apiClient } from './apiClient';

export const loginAPI = async (email, password) => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const data = await apiClient('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData
  });

  if (data && data.access_token) {
    localStorage.setItem('access_token', data.access_token);
  }
  return true;
};

export const registerAPI = (email, password, rol) => {
  return apiClient('/api/auth/signup', {
    method: 'POST',
    body: { email, password, rol }
  });
};