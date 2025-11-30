import { apiFetch } from "./apiClient.js";

export async function fetchDealInsights(dealId) {
  const res = await apiFetch(`/deal-insights/${encodeURIComponent(dealId)}`);
  if (!res.ok) throw new Error("Unable to load insights");
  return res.json();
}
