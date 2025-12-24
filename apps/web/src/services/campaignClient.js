import { apiFetch } from "./apiClient.js";

export async function fetchUserCampaigns({ session, userId }) {
  const target = userId || session?.id || "me";
  const response = await apiFetch(`/api/campaigns/user/${encodeURIComponent(target)}`);
  if (!response.ok) {
    // Log 403 errors for debugging auth issues
    if (response.status === 403) {
      console.warn(`[Campaigns] 403 Forbidden for user ${target}. Check authentication and permissions.`);
    }
    // Try to parse error response
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData.error || `Failed to load campaigns (${response.status})`;
    throw new Error(errorMsg);
  }
  const data = await response.json();
  // Defensive: Ensure campaigns is always an array
  return {
    campaigns: Array.isArray(data.campaigns) ? data.campaigns : [],
    ...data
  };
}

export async function fetchCampaign({ campaignId }) {
  const response = await apiFetch(`/api/campaigns/${encodeURIComponent(campaignId)}`);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Unable to load campaign");
  }
  return response.json();
}
