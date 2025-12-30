import { apiFetch } from "./apiClient.js";

export async function fetchBriefVersions({ briefId }) {
  // REMOVED: Briefs feature not implemented - endpoint returns 410
  throw new Error("Briefs feature is not available. Use opportunities instead.");
  // const response = await apiFetch(`/briefs/${encodeURIComponent(briefId)}/versions`);
  if (response.status === 404) {
    return { versions: [] };
  }
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Unable to load versions");
  }
  return response.json();
}

export async function createBriefVersion({ briefId, data }) {
  // REMOVED: Briefs feature not implemented - endpoint returns 410
  throw new Error("Briefs feature is not available. Use opportunities instead.");
  // const response = await apiFetch(`/briefs/${encodeURIComponent(briefId)}/version`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ data })
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Unable to save version");
  }
  return response.json();
}

export async function restoreBriefVersion({ versionId }) {
  // REMOVED: Briefs feature not implemented - endpoint returns 410
  throw new Error("Briefs feature is not available. Use opportunities instead.");
  // const response = await apiFetch(`/briefs/restore/${encodeURIComponent(versionId)}`, {
    method: "POST"
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Unable to restore version");
  }
  return response.json();
}
