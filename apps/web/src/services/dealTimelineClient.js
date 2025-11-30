import { apiFetch } from "./apiClient.js";

export async function fetchTimeline(dealId) {
  const res = await apiFetch(`/deal-timeline/${encodeURIComponent(dealId)}`);
  if (!res.ok) throw new Error("Failed to load timeline");
  return res.json();
}

export async function addNote(dealId, message) {
  const res = await apiFetch(`/deal-timeline/${encodeURIComponent(dealId)}/note`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });
  if (!res.ok) throw new Error("Failed to add note");
  return res.json();
}
