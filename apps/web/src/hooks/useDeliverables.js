import { apiFetch } from "../services/apiClient.js";

export function useDeliverables() {
  async function list() {
    const res = await apiFetch("/deliverables");
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Failed to load deliverables");
    return data;
  }

  async function updateStatus(id, status) {
    const res = await apiFetch(`/deliverables/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Failed to update deliverable");
    return data;
  }

  return { list, updateStatus };
}
