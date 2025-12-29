import { apiFetch } from "./apiClient.js";

export async function getCalendarEvents() {
  const response = await apiFetch("/api/calendar/events");
  
  // Return response object with status for explicit handling
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch calendar events" }));
    return {
      success: false,
      status: response.status,
      error: error.error || "Failed to fetch calendar events",
    };
  }
  
  const data = await response.json();
  return { ...data, status: response.status };
}

export async function createCalendarEvent(payload) {
  const response = await apiFetch("/api/calendar/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to create event" }));
    throw new Error(errorData.error);
  }
  return response.json();
}

export async function updateCalendarEvent(eventId, payload) {
  const response = await apiFetch(`/api/calendar/events/${eventId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to update event" }));
    throw new Error(errorData.error);
  }
  return response.json();
}

export async function deleteCalendarEvent(eventId) {
  const response = await apiFetch(`/api/calendar/events/${eventId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete event");
  }
  return response.ok;
}

export async function syncGoogleCalendar() {
  const response = await apiFetch("/api/calendar/events/sync", {
    method: "POST",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to sync calendar" }));
    throw new Error(errorData.error);
  }
  return response.json();
}
