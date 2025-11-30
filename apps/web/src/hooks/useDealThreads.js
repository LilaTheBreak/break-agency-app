import { apiFetch } from "../services/apiClient.js";

export function useDealThreads() {
  async function rebuild() {
    const res = await apiFetch("/threads/rebuild", { method: "POST" });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload?.message || "Unable to rebuild threads");
    return payload;
  }

  async function list() {
    const res = await apiFetch("/threads");
    const payload = await res.json();
    if (!res.ok) throw new Error(payload?.message || "Unable to load threads");
    return payload;
  }

  async function get(id) {
    const res = await apiFetch(`/threads/${encodeURIComponent(id)}`);
    const payload = await res.json();
    if (!res.ok) throw new Error(payload?.message || "Unable to load thread");
    return payload;
  }

  return { rebuild, list, get };
}
