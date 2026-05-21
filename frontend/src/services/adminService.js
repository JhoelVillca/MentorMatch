const API_BASE = "/api/admin";

export const getAllUsers = async () => {
  const response = await fetch(`${API_BASE}/users`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Error al obtener usuarios.");
  return data;
};

export const softDeleteUser = async (userId) => {
  const response = await fetch(`${API_BASE}/users/${userId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Error al desactivar usuario.");
  return data;
};

export const updateUserStatus = async (userId, estado) => {
  const response = await fetch(`${API_BASE}/users/${userId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ estado }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Error al cambiar estado.");
  return data;
};

export const deleteUser = softDeleteUser;