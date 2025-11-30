import { apiFetch } from "../services/apiClient.js";

export async function checkRisk(text) {
  const res = await apiFetch("/risk/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload?.message || "Unable to check risk.");
  return payload;
}
