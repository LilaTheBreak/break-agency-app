import { apiFetch } from "./apiClient.js";

/**
 * Fetches the Google OAuth URL from the backend to initiate account linking.
 * @returns {Promise<{url: string}>}
 */
export async function getGmailAuthUrl() {
  const response = await apiFetch("/gmail/auth/url");
  if (!response.ok) {
    throw new Error("Failed to get Gmail authentication URL.");
  }
  return response.json();
}

/**
 * Fetches the list of messages from the user's connected Gmail account.
 * @returns {Promise<any[]>}
 */
export async function listGmailMessages() {
  const response = await apiFetch("/gmail/messages");
  if (!response.ok) {
    throw new Error("Failed to list Gmail messages.");
  }
  return response.json();
}

/**
 * Fetches AI-extracted deal drafts for a specific user.
 * @param {string} userId
 * @returns {Promise<any[]>}
 */
export async function getDealDrafts(userId) {
  const response = await apiFetch(`/deals/extract/user/${userId}`);
  if (!response.ok) {
    throw new Error("Failed to get deal drafts.");
  }
  return response.json();
}