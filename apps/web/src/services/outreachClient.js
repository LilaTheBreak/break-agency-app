import { apiFetch } from "./apiClient.js";

export async function fetchOutreachRecords() {
  try {
    const response = await apiFetch("/api/outreach/records");
    if (!response.ok) {
      console.warn("[Outreach] Failed to fetch outreach records:", response.status);
      return []; // Return empty array instead of throwing
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("[Outreach] Error fetching outreach records:", error.message);
    return []; // Safe fallback
  }
}

export async function createOutreachRecord(data) {
  try {
    const response = await apiFetch("/api/outreach/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error("Failed to create outreach record");
    }
    return response.json();
  } catch (error) {
    console.error("[Outreach] Error creating outreach record:", error.message);
    throw error; // Creation errors should be thrown
  }
}

export async function updateOutreachRecord(id, updates) {
  try {
    const response = await apiFetch(`/api/outreach/records/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    if (!response.ok) {
      throw new Error("Failed to update outreach record");
    }
    return response.json();
  } catch (error) {
    console.error("[Outreach] Error updating outreach record:", error.message);
    throw error; // Update errors should be thrown
  }
}

export async function fetchGmailThread(outreachId) {
  try {
    const response = await apiFetch(`/api/outreach/records/${outreachId}/gmail-thread`);
    if (!response.ok) {
      console.warn("[Outreach] Failed to fetch Gmail thread:", response.status);
      return null; // Return null instead of throwing
    }
    return response.json();
  } catch (error) {
    console.warn("[Outreach] Error fetching Gmail thread:", error.message);
    return null; // Safe fallback
  }
}

export async function addOutreachNote(outreachId, body) {
  try {
    const response = await apiFetch(`/api/outreach/records/${outreachId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body })
    });
    if (!response.ok) {
      throw new Error("Failed to add note");
    }
    return response.json();
  } catch (error) {
    console.error("[Outreach] Error adding note:", error.message);
    throw error; // Creation errors should be thrown
  }
}

export async function fetchOutreachNotes(outreachId) {
  try {
    const response = await apiFetch(`/api/outreach/records/${outreachId}/notes`);
    if (!response.ok) {
      console.warn("[Outreach] Failed to fetch notes:", response.status);
      return []; // Return empty array instead of throwing
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("[Outreach] Error fetching notes:", error.message);
    return []; // Safe fallback
  }
}

export async function addOutreachTask(outreachId, taskData) {
  try {
    const response = await apiFetch(`/api/outreach/records/${outreachId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData)
    });
    if (!response.ok) {
      throw new Error("Failed to add task");
    }
    return response.json();
  } catch (error) {
    console.error("[Outreach] Error adding task:", error.message);
    throw error; // Creation errors should be thrown
  }
}

export async function fetchOutreachTasks(outreachId) {
  try {
    const response = await apiFetch(`/api/outreach/records/${outreachId}/tasks`);
    if (!response.ok) {
      console.warn("[Outreach] Failed to fetch tasks:", response.status);
      return []; // Return empty array instead of throwing
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("[Outreach] Error fetching tasks:", error.message);
    return []; // Safe fallback
  }
}

export async function updateOutreachTask(taskId, updates) {
  try {
    const response = await apiFetch(`/api/outreach/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    if (!response.ok) {
      throw new Error("Failed to update task");
    }
    return response.json();
  } catch (error) {
    console.error("[Outreach] Error updating task:", error.message);
    throw error; // Update errors should be thrown
  }
}

export async function fetchUpcomingReminders() {
  try {
    const response = await apiFetch("/api/outreach/reminders");
    if (!response.ok) {
      console.warn("[Outreach] Failed to fetch reminders:", response.status);
      return []; // Return empty array instead of throwing
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("[Outreach] Error fetching reminders:", error.message);
    return []; // Safe fallback
  }
}
