import { apiFetch } from "../services/apiClient.js";

export function useNegotiationInsights() {
  return {
    generate: (dealDraftId) =>
      apiFetch(`/negotiation/generate/${encodeURIComponent(dealDraftId)}`, { method: "POST" }).then((r) => r.json()),
    listForUser: (userId) => apiFetch(`/negotiation/user/${encodeURIComponent(userId)}`).then((r) => r.json())
  };
}
