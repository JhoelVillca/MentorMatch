import { apiClient } from './apiClient';

export const loginAPI = async (email, password) => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  await apiClient('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData
  });
  return true;
};

export const registerAPI = (email, password, rol) => {
  return apiClient('/api/auth/signup', {
    method: 'POST',
    body: { email, password, rol }
  });
};