import { apiClient } from './apiClient';

export const getSalas = () => apiClient('/api/chat/salas');

export const getMensajes = (salaId, before = null, limit = 30) => {
  let url = `/api/chat/${salaId}/mensajes?limit=${limit}`;
  if (before) url += `&before=${encodeURIComponent(before)}`;
  return apiClient(url);
};

export const markAsRead = (salaId) => 
  apiClient(`/api/chat/salas/${salaId}/leer`, { method: 'PATCH' });


export const iniciarChat = (id_mentor = null, id_mentee = null) => {
  return apiClient('/api/chat/iniciar', {
    method: 'POST',
    body: { id_mentor, id_mentee }
  });
};

export const getUnreadCount = () => 
  apiClient('/api/chat/unread-count');

