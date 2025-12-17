import { apiFetch } from "./apiClient.js";

export async function fetchOutreachRecords() {
  const response = await apiFetch("/outreach/records");
  if (!response.ok) {
    throw new Error("Failed to fetch outreach records");
  }
  return response.json();
}

export async function createOutreachRecord(data) {
  const response = await apiFetch("/outreach/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error("Failed to create outreach record");
  }
  return response.json();
}

export async function updateOutreachRecord(id, updates) {
  const response = await apiFetch(`/outreach/records/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates)
  });
  if (!response.ok) {
    throw new Error("Failed to update outreach record");
  }
  return response.json();
}

export async function fetchGmailThread(outreachId) {
  const response = await apiFetch(`/outreach/records/${outreachId}/gmail-thread`);
  if (!response.ok) {
    throw new Error("Failed to fetch Gmail thread");
  }
  return response.json();
}

export async function addOutreachNote(outreachId, body) {
  const response = await apiFetch(`/outreach/records/${outreachId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body })
  });
  if (!response.ok) {
    throw new Error("Failed to add note");
  }
  return response.json();
}

export async function fetchOutreachNotes(outreachId) {
  const response = await apiFetch(`/outreach/records/${outreachId}/notes`);
  if (!response.ok) {
    throw new Error("Failed to fetch notes");
  }
  return response.json();
}

export async function addOutreachTask(outreachId, taskData) {
  const response = await apiFetch(`/outreach/records/${outreachId}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(taskData)
  });
  if (!response.ok) {
    throw new Error("Failed to add task");
  }
  return response.json();
}

export async function fetchOutreachTasks(outreachId) {
  const response = await apiFetch(`/outreach/records/${outreachId}/tasks`);
  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }
  return response.json();
}

export async function updateOutreachTask(taskId, updates) {
  const response = await apiFetch(`/outreach/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates)
  });
  if (!response.ok) {
    throw new Error("Failed to update task");
  }
  return response.json();
}

export async function fetchUpcomingReminders() {
  const response = await apiFetch("/outreach/reminders");
  if (!response.ok) {
    throw new Error("Failed to fetch reminders");
  }
  return response.json();
}
