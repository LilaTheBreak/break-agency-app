import { apiFetch } from "../services/apiClient.js";

export function useCampaignBuilder() {
  return {
    buildFromDeal: (dealDraftId) =>
      apiFetch(`/campaign-builder/from-deal/${encodeURIComponent(dealDraftId)}`, { method: "POST" }).then((r) => r.json())
  };
}
