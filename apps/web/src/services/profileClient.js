import { DEFAULT_PROFILE, USER_PROFILES } from "../data/users.js";
import { apiFetch } from "./apiClient.js";

function mergeWithStatic(email, remoteProfile = {}) {
  const fallback = USER_PROFILES[email.toLowerCase()] || { ...DEFAULT_PROFILE, email };
  return {
    ...fallback,
    ...remoteProfile,
    stats: fallback.stats,
    activity: fallback.activity,
    tags: fallback.tags,
    personaRoute: fallback.personaRoute,
    personaLabel: fallback.personaLabel
  };
}

async function handleResponse(response) {
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || "Request failed");
  }
  return response.json();
}

export async function fetchProfile(email) {
  if (!email) {
    return { ...DEFAULT_PROFILE };
  }
  try {
    const response = await apiFetch(`/profiles/${encodeURIComponent(email)}`);
    const data = await handleResponse(response);
    return mergeWithStatic(email, data.profile);
  } catch (error) {
    console.warn("Falling back to static profile", error);
    return mergeWithStatic(email, {});
  }
}

export async function saveProfile(email, payload) {
  if (!email) {
    throw new Error("Email is required");
  }
  const body = JSON.stringify({
    ...payload,
    status: payload.status ?? payload.accountType ?? null
  });
  const response = await apiFetch(`/profiles/${encodeURIComponent(email)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body
  });
  const data = await handleResponse(response);
  return mergeWithStatic(email, data.profile);
}
