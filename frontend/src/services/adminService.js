import { apiClient } from './apiClient';

const API_BASE = "/api/admin";

export const getAllUsers = () => apiClient(`${API_BASE}/users`);

export const softDeleteUser = (userId) => 
  apiClient(`${API_BASE}/users/${userId}`, { method: 'DELETE' });

export const updateUserStatus = (userId, estado) => 
  apiClient(`${API_BASE}/users/${userId}/status`, {
    method: 'PATCH',
    body: { estado }
  });

export const deleteUser = softDeleteUser;