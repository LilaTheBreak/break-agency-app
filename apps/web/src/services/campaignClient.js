import { apiFetch } from "./apiClient.js";

export async function fetchUserCampaigns({ session, userId }) {
  const target = userId || session?.id || "me";
  const response = await apiFetch(`/campaigns/user/${encodeURIComponent(target)}`);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Unable to load campaigns");
  }
  return response.json();
}

export async function fetchCampaign({ campaignId }) {
  const response = await apiFetch(`/campaigns/${encodeURIComponent(campaignId)}`);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Unable to load campaign");
  }
  return response.json();
}
