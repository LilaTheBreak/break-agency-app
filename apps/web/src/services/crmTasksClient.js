import { apiFetch } from "./apiClient.js";

/**
 * Fetch all users for @mentions and assignments
 */
export async function fetchTaskUsers() {
  const response = await apiFetch(`/api/crm-tasks/users`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch users" }));
    throw new Error(error.error || "Failed to fetch users");
  }
  
  return response.json();
}

/**
 * Fetch all talents/creators for task relations
 */
export async function fetchTaskTalents() {
  const response = await apiFetch(`/api/crm-tasks/talents`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch talents" }));
    throw new Error(error.error || "Failed to fetch talents");
  }
  
  return response.json();
}

/**
 * Fetch all CRM tasks with optional filters
 */
export async function fetchCrmTasks(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);
  if (filters.priority) params.append("priority", filters.priority);
  if (filters.owner) params.append("owner", filters.owner);
  if (filters.brandId) params.append("brandId", filters.brandId);
  if (filters.campaignId) params.append("campaignId", filters.campaignId);

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await apiFetch(`/api/crm-tasks${query}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch tasks" }));
    throw new Error(error.error || "Failed to fetch tasks");
  }
  
  return response.json();
}

/**
 * Fetch a single CRM task by ID
 */
export async function fetchCrmTaskById(id) {
  const response = await apiFetch(`/api/crm-tasks/${id}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch task" }));
    throw new Error(error.error || "Failed to fetch task");
  }
  
  return response.json();
}

/**
 * Create a new CRM task
 */
export async function createCrmTask(taskData) {
  const response = await apiFetch(`/api/crm-tasks`, {
    method: "POST",
    body: JSON.stringify(taskData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to create task" }));
    throw new Error(error.error || "Failed to create task");
  }
  
  return response.json();
}

/**
 * Update an existing CRM task
 */
export async function updateCrmTask(id, taskData) {
  const response = await apiFetch(`/api/crm-tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(taskData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to update task" }));
    throw new Error(error.error || "Failed to update task");
  }
  
  return response.json();
}

/**
 * Delete a CRM task
 */
export async function deleteCrmTask(id) {
  const response = await apiFetch(`/api/crm-tasks/${id}`, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to delete task" }));
    throw new Error(error.error || "Failed to delete task");
  }
  
  return response.json();
}
