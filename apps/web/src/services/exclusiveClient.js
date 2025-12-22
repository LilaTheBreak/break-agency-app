import { apiFetch } from "./apiClient.js";

/**
 * Creator Goals API Client
 */

export async function fetchGoals(filters = {}) {
  const params = new URLSearchParams();
  if (filters.active !== undefined) params.append("active", filters.active);
  if (filters.category) params.append("category", filters.category);
  
  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await apiFetch(`/api/creator-goals${query}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch goals" }));
    throw new Error(error.error || "Failed to fetch goals");
  }
  
  return response.json();
}

export async function fetchGoalById(id) {
  const response = await apiFetch(`/api/creator-goals/${id}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch goal" }));
    throw new Error(error.error || "Failed to fetch goal");
  }
  
  return response.json();
}

export async function createGoal(goalData) {
  const response = await apiFetch("/api/creator-goals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(goalData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to create goal" }));
    throw new Error(error.error || "Failed to create goal");
  }
  
  return response.json();
}

export async function updateGoal(id, goalData) {
  const response = await apiFetch(`/api/creator-goals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(goalData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to update goal" }));
    throw new Error(error.error || "Failed to update goal");
  }
  
  return response.json();
}

export async function deleteGoal(id) {
  const response = await apiFetch(`/api/creator-goals/${id}`, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to delete goal" }));
    throw new Error(error.error || "Failed to delete goal");
  }
  
  return response.json();
}

/**
 * Wellness Check-ins API Client
 */

export async function fetchWellnessCheckins(filters = {}) {
  const params = new URLSearchParams();
  if (filters.limit) params.append("limit", filters.limit);
  if (filters.days) params.append("days", filters.days);
  
  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await apiFetch(`/api/wellness-checkins${query}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch check-ins" }));
    throw new Error(error.error || "Failed to fetch wellness check-ins");
  }
  
  return response.json();
}

export async function fetchLatestWellnessCheckin() {
  const response = await apiFetch("/api/wellness-checkins/latest");
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch latest check-in" }));
    throw new Error(error.error || "Failed to fetch latest wellness check-in");
  }
  
  return response.json();
}

export async function fetchWellnessStats(days = 30) {
  const response = await apiFetch(`/api/wellness-checkins/stats?days=${days}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch stats" }));
    throw new Error(error.error || "Failed to fetch wellness statistics");
  }
  
  return response.json();
}

export async function createWellnessCheckin(checkinData) {
  const response = await apiFetch("/api/wellness-checkins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(checkinData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to create check-in" }));
    throw new Error(error.error || "Failed to create wellness check-in");
  }
  
  return response.json();
}

export async function fetchWellnessCheckinById(id) {
  const response = await apiFetch(`/api/wellness-checkins/${id}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch check-in" }));
    throw new Error(error.error || "Failed to fetch wellness check-in");
  }
  
  return response.json();
}
