import { apiFetch } from "./apiClient.js";

export async function getCalendarEvents() {
  const response = await apiFetch("/api/calendar-events");
  if (!response.ok) throw new Error("Failed to fetch calendar events");
  return response.json();
}

export async function createCalendarEvent(payload) {
  const response = await apiFetch("/api/calendar-events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to create event" }));
    throw new Error(errorData.error);
  }
  return response.json();
}

export async function deleteCalendarEvent(eventId) {
  const response = await apiFetch(`/api/calendar-events/${eventId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete event");
  }
  return response.ok;
}