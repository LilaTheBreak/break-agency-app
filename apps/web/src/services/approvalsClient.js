import { apiFetch } from "./apiClient.js";

export async function getApprovals(filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await apiFetch(`/api/approvals?${params.toString()}`);
  if (!response.ok) throw new Error("Failed to fetch approvals");
  return response.json();
}

export async function approveContent(id) {
  const response = await apiFetch(`/api/approvals/${id}/approve`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to approve content");
  return response.json();
}

export async function rejectContent(id) {
  const response = await apiFetch(`/api/approvals/${id}/reject`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to reject content");
  return response.json();
}