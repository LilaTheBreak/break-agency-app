import { apiFetch } from "./apiClient.js";

export async function fetchDeals(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  const query = params.toString();
  const res = await apiFetch(`/deals${query ? `?${query}` : ""}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to load deals");
  }
  return res.json();
}
