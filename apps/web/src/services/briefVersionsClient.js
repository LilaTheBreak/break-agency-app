import { apiFetch } from "./apiClient.js";

function authHeaders(session) {
  if (!session?.email) return {};
  const headers = { "x-user-id": session.email };
  if (session.roles?.length) {
    headers["x-user-roles"] = session.roles.join(",");
  }
  return headers;
}

export async function fetchBriefVersions({ briefId, session }) {
  const response = await apiFetch(`/briefs/${encodeURIComponent(briefId)}/versions`, {
    headers: authHeaders(session)
  });
  if (response.status === 404) {
    return { versions: [] };
  }
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Unable to load versions");
  }
  return response.json();
}

export async function createBriefVersion({ briefId, data, session }) {
  const response = await apiFetch(`/briefs/${encodeURIComponent(briefId)}/version`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(session)
    },
    body: JSON.stringify({ data })
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Unable to save version");
  }
  return response.json();
}

export async function restoreBriefVersion({ versionId, session }) {
  const response = await apiFetch(`/briefs/restore/${encodeURIComponent(versionId)}`, {
    method: "POST",
    headers: authHeaders(session)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Unable to restore version");
  }
  return response.json();
}
