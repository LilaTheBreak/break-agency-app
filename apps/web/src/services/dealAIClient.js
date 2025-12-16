import { apiFetch } from "./apiClient.js";

export const runDealIntelligence = async (dealId) => {
  const response = await apiFetch(`/api/deals/intelligence/run/${dealId}`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to run deal intelligence");
  return response.json();
};

export const getDealIntelligence = async (dealId) => {
  const response = await apiFetch(`/api/deals/intelligence/${dealId}`);
  if (!response.ok) throw new Error("Failed to fetch deal intelligence");
  return response.json();
};

export const draftNegotiationEmail = async (dealId, context) => {
  const response = await apiFetch(`/api/deals/${dealId}/draft-email`, {
    method: "POST",
    body: JSON.stringify({ context }),
  });
  if (!response.ok) throw new Error("Failed to draft negotiation email");
  return response.json();
};