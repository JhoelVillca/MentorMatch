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

export const getPaquetesPendientes = () => apiClient(`${API_BASE}/paquetes/pendientes`);

export const validarPaquete = (paqueteId, estado_validacion) => 
  apiClient(`${API_BASE}/paquetes/${paqueteId}/validar`, {
    method: 'PATCH',
    body: { estado_validacion }
  });

export const deleteUser = softDeleteUser;