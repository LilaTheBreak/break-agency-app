import { apiFetch } from "./apiClient.js";
import { isFeatureEnabled } from "../config/features.js";

// Phase 5: Briefs feature re-enabled with full implementation
export async function fetchBriefVersions({ briefId }) {
  if (!isFeatureEnabled("BRIEFS_ENABLED")) {
    throw new Error("Briefs feature is disabled");
  }

  const response = await apiFetch(`/api/briefs/${encodeURIComponent(briefId)}/versions`);
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
  if (!isFeatureEnabled("BRIEFS_ENABLED")) {
    throw new Error("Briefs feature is disabled");
  }

  const response = await apiFetch(`/api/briefs/${encodeURIComponent(briefId)}/versions`, {
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

export async function restoreBriefVersion({ versionId, briefId }) {
  if (!isFeatureEnabled("BRIEFS_ENABLED")) {
    throw new Error("Briefs feature is disabled");
  }

  if (!briefId) {
    throw new Error("briefId is required to restore version");
  }

  const response = await apiFetch(`/api/briefs/restore/${encodeURIComponent(versionId)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ briefId })
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Unable to restore version");
  }
  return response.json();
}
