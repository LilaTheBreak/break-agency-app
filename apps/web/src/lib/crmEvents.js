// Phase 1: Removed localStorage functions - all CRUD operations now use API via crmClient.js
// This file now only contains utility functions and constants

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

