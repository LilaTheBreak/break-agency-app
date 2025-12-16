import { apiFetch } from "./apiClient.js";

export async function getUsers(limit = 25) {
  const response = await apiFetch(`/api/users?limit=${limit}`);
  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
}

export async function createUser(payload) {
  const response = await apiFetch("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to create user" }));
    throw new Error(errorData.error);
  }
  return response.json();
}

export async function deleteUser(userId) {
  const response = await apiFetch(`/api/users/${userId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to delete user" }));
    throw new Error(errorData.error);
  }
  return response.json();
}

export async function updateUserRoles(userId, roles) {
  const response = await apiFetch(`/api/users/${userId}/roles`, {
    method: "PUT",
    body: JSON.stringify({ roles }),
  });
  if (!response.ok) throw new Error("Failed to update roles");
  return response.json();
}