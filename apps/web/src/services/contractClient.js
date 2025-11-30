import { apiFetch } from "./apiClient.js";

export async function processContract({ fileUrl, dealId }) {
  const res = await apiFetch("/contracts/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileUrl, dealId })
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload?.message || "Contract processing failed");
  return payload;
}

export async function listContracts() {
  const res = await apiFetch("/contracts");
  const payload = await res.json();
  if (!res.ok) throw new Error(payload?.message || "Unable to list contracts");
  return payload;
}

export async function createContractRequest({ title, parties, variables }) {
  const res = await apiFetch("/contracts/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, parties, variables })
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload?.message || "Unable to create contract request");
  return payload;
}

export async function sendContractRequest({ contractId }) {
  const res = await apiFetch(`/contracts/${contractId}/send`, { method: "POST" });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload?.message || "Unable to send contract");
  return payload;
}

export async function fetchContractStatus(contractId) {
  const res = await apiFetch(`/contracts/${contractId}/status`);
  const payload = await res.json();
  if (!res.ok) throw new Error(payload?.message || "Unable to fetch contract status");
  return payload;
}
