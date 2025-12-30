import { apiFetch } from "./apiClient.js";

export async function fetchUserCampaigns({ session, userId }) {
  const target = userId || session?.id || "me";
  const response = await apiFetch(`/api/campaigns/user/${encodeURIComponent(target)}`);
  
  // Handle errors gracefully - return empty campaigns array instead of throwing
  if (!response.ok) {
    // For 403/503, return empty array (graceful degradation)
    if (response.status === 403 || response.status === 503) {
      return { campaigns: [] };
    }
    // For other errors, try to parse but default to empty array
    try {
      const errorData = await response.json();
      // If error response has campaigns, use it; otherwise return empty
      if (Array.isArray(errorData.campaigns)) {
        return { campaigns: errorData.campaigns };
      }
    } catch {
      // If parsing fails, return empty array
    }
    return { campaigns: [] };
  }
  
  const data = await response.json();
  // API now returns array directly, but handle both formats for backward compatibility
  // Defensive: Ensure campaigns is always an array
  if (Array.isArray(data)) {
    return { campaigns: data };
  }
  return {
    campaigns: Array.isArray(data.campaigns) ? data.campaigns : (Array.isArray(data.data) ? data.data : []),
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
