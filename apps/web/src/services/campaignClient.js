import { apiFetch } from "./apiClient.js";

function authHeaders(session) {
  if (!session?.email) return {};
  const headers = { "x-user-id": session.email };
  if (session.roles?.length) headers["x-user-roles"] = session.roles.join(",");
  return headers;
}

export async function fetchUserCampaigns({ session, userId }) {
  const target = userId || session?.email || "me";
  const response = await apiFetch(`/campaigns/user/${encodeURIComponent(target)}`, {
    headers: {
      ...authHeaders(session)
    }
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Unable to load campaigns");
  }
  return response.json();
}

export async function fetchCampaign({ session, campaignId }) {
  const response = await apiFetch(`/campaigns/${encodeURIComponent(campaignId)}`, {
    headers: authHeaders(session)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Unable to load campaign");
  }
  return response.json();
}
