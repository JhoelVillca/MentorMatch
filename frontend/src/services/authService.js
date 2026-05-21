import { apiClient } from './apiClient';

export const loginAPI = async (email, password) => {
  await apiClient('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: email, password: password })
  });
  return true;
};

export const registerAPI = (email, password, rol) => {
  return apiClient('/api/auth/signup', {
    method: 'POST',
    body: { email, password, rol }
  });
};