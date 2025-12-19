import { DEFAULT_PROFILE, USER_PROFILES } from "../data/users.js";
import { apiFetch } from "./apiClient.js";

const LOCAL_PROFILE_KEY = "break_profile_overrides_v1";

function readLocalProfiles() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_PROFILE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocalProfile(email, profile) {
  if (typeof window === "undefined") return;
  const existing = readLocalProfiles();
  const next = { ...existing, [email.toLowerCase()]: profile };
  try {
    window.localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

function mergeWithStatic(email, remoteProfile = {}) {
  const overrides = readLocalProfiles()[email.toLowerCase()] || {};
  const fallback = USER_PROFILES[email.toLowerCase()] || { ...DEFAULT_PROFILE, email };
  return {
    ...fallback,
    ...remoteProfile,
    ...overrides,
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
  try {
    const response = await apiFetch(`/profiles/${encodeURIComponent(email)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body
    });
    const data = await handleResponse(response);
    const merged = mergeWithStatic(email, data.profile);
    writeLocalProfile(email, merged);
    return merged;
  } catch (err) {
    console.warn("Save failed, storing locally", err);
    const merged = mergeWithStatic(email, payload);
    writeLocalProfile(email, merged);
    return merged;
  }
}
