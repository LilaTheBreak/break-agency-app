import { apiFetch } from "../services/apiClient.js";

export async function getSuitabilityScore({ talent, brief }) {
  const res = await apiFetch("/suitability/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ talent, brief })
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload?.message || "Unable to calculate score.");
  return payload;
}
