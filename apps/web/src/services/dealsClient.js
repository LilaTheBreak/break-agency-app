import { apiFetch } from "./apiClient.js";

export async function fetchDeals(filters = {}) {
  const params = new URLSearchParams(filters);
  const res = await apiFetch(`/api/deals?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to load deals");
  }
  return res.json();
}

export async function fetchDeal(dealId) {
  const response = await apiFetch(`/api/deals/${dealId}`);
  if (!response.ok) throw new Error("Failed to fetch deal");
  return response.json();
}

export async function createDeal(payload) {
  const response = await apiFetch("/api/deals", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to create deal");
  return response.json();
}

export async function updateDeal(dealId, payload) {
  const response = await apiFetch(`/api/deals/${dealId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to update deal");
  return response.json();
}
