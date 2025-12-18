const STORAGE_KEY = "break_admin_crm_events_v1";

export const EVENT_TYPES = [
  "Brand event",
  "Press event",
  "Creator trip",
  "Panel / speaking",
  "Workshop",
  "Internal",
  "Other"
];

export const EVENT_STATUSES = ["Planned", "Confirmed", "Completed", "Cancelled"];

function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function readCrmEvents() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = safeJsonParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function writeCrmEvents(events) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(events) ? events : []));
}

export function upsertCrmEvent(nextEvent) {
  const events = readCrmEvents();
  const exists = events.some((e) => e.id === nextEvent.id);
  const updated = exists ? events.map((e) => (e.id === nextEvent.id ? nextEvent : e)) : [nextEvent, ...events];
  writeCrmEvents(updated);
  return updated;
}

export function deleteCrmEvent(eventId) {
  const events = readCrmEvents();
  const updated = events.filter((e) => e.id !== eventId);
  writeCrmEvents(updated);
  return updated;
}

export function formatEventDateTimeRange({ startDateTime, endDateTime }) {
  const format = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  const start = format(startDateTime);
  const end = format(endDateTime);
  if (start && end) return `${start} → ${end}`;
  return start || end || "";
}

export function isUpcomingEvent(event, now = new Date()) {
  const start = event?.startDateTime ? new Date(event.startDateTime) : null;
  if (!start || Number.isNaN(start.getTime())) return false;
  return start.getTime() >= now.getTime();
}

export function isPastEvent(event, now = new Date()) {
  const start = event?.startDateTime ? new Date(event.startDateTime) : null;
  if (!start || Number.isNaN(start.getTime())) return false;
  return start.getTime() < now.getTime();
}

