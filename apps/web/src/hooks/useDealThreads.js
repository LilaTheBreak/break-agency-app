import { apiFetch } from "../services/apiClient.js";

export function useDealThreads() {
  async function rebuild() {
    try {
      const res = await apiFetch("/threads/rebuild", { method: "POST" });
      
      if (!res.ok) {
        return { success: false, error: "Unable to rebuild threads", status: res.status };
      }
      
      const payload = await res.json();
      return { success: true, data: payload };
    } catch (err) {
      return { success: false, error: err.message || "Network error" };
    }
  }

  async function list() {
    try {
      const res = await apiFetch("/threads");
      
      if (!res.ok) {
        // Return empty list for graceful degradation
        return { success: true, data: [] };
      }
      
      const payload = await res.json();
      return { success: true, data: payload };
    } catch (err) {
      return { success: true, data: [] }; // Graceful fallback
    }
  }

  async function get(id) {
    try {
      const res = await apiFetch(`/threads/${encodeURIComponent(id)}`);
      
      if (!res.ok) {
        return { success: false, error: "Thread not found", status: res.status };
      }
      
      const payload = await res.json();
      return { success: true, data: payload };
    } catch (err) {
      return { success: false, error: err.message || "Network error" };
    }
  }

  return { rebuild, list, get };
}
