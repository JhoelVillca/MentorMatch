/**
 * Servicio para las operaciones de administración
 * Consumidor de la API /admin/* del backend
 */

const API_BASE = '/api/admin';

/**
 * Obtiene la lista de todos los usuarios registrados
 * @param {string} token - Token JWT del usuario administrador
 * @returns {Promise<Array>} Lista de usuarios
 */
export const getAllUsers = async (token) => {
  const response = await fetch(`${API_BASE}/users`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Error al obtener usuarios.');
  }

  return data;
};

/**
 * Elimina un usuario del sistema
 * @param {string} token - Token JWT del usuario administrador
 * @param {string} userId - ID del usuario a eliminar
 * @returns {Promise<Object>} Respuesta del servidor
 */
export const deleteUser = async (token, userId) => {
  const response = await fetch(`${API_BASE}/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Error al eliminar usuario.');
  }

  return data;
};