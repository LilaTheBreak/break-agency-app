import { apiFetch } from "../services/apiClient.js";

export function useDealExtraction() {
  return {
    extractDeal: (emailId) =>
      apiFetch(`/deals/extract/extract/${encodeURIComponent(emailId)}`, { method: "POST" }).then((r) => r.json()),
    extractDealAsync: (emailId) =>
      apiFetch(`/deals/extract/extract/${encodeURIComponent(emailId)}/async`, { method: "POST" }).then((r) => r.json()),
    listDrafts: (userId) => apiFetch(`/deals/extract/user/${encodeURIComponent(userId)}`).then((r) => r.json())
  };
}
