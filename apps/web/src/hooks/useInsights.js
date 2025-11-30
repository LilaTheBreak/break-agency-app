import { apiFetch } from "../services/apiClient.js";

export function useInsights() {
  return {
    getInsights: (userId) => apiFetch(`/insights/${encodeURIComponent(userId)}`).then((r) => r.json()),
    generateInsights: (userId) =>
      apiFetch(`/insights/${encodeURIComponent(userId)}/generate`, { method: "POST" }).then((r) => r.json()),
    getWeeklyReports: (userId) => apiFetch(`/insights/${encodeURIComponent(userId)}/weekly`).then((r) => r.json())
  };
}
