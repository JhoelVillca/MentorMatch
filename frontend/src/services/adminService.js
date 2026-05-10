export async function fetchAdminUsers(token) {
  const response = await fetch('/api/admin/users', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.detail === 'string' ? data.detail : 'No se pudo cargar la lista de usuarios.'
    );
  }
  return data;
}
