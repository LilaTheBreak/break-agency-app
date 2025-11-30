import { apiFetch } from "./apiClient.js";

export async function fetchDeliverables(dealId) {
  const res = await apiFetch(`/deliverables?dealId=${encodeURIComponent(dealId)}`);
  const payload = await res.json();
  if (!res.ok) throw new Error(payload?.message || "Failed to load deliverables");
  return payload;
}

export async function createDeliverableRequest(data) {
  const res = await apiFetch("/deliverables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload?.message || "Failed to create deliverable");
  return payload;
}

export async function runDeliverableQARequest(id) {
  const res = await apiFetch(`/deliverables/${encodeURIComponent(id)}/qa`, { method: "POST" });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload?.message || "Failed to run QA");
  return payload;
}

export async function runDeliverablePredictRequest(id) {
  const res = await apiFetch(`/deliverables/${encodeURIComponent(id)}/predict`, { method: "POST" });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload?.message || "Failed to run prediction");
  return payload;
}
