import { apiFetch } from "./apiClient.js";

/**
 * Fetches the Google OAuth URL from the backend to initiate account linking.
 * @returns {Promise<{url: string}>}
 */
export async function getGmailAuthUrl() {
  const response = await apiFetch("/api/gmail/auth/url");
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
  try {
    const response = await apiFetch("/api/gmail/messages");
    
    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = "Failed to list Gmail messages.";
      try {
        const errorData = await response.json();
        if (errorData.error === "gmail_not_connected") {
          errorMessage = "Gmail account is not connected. Please connect your Gmail account first.";
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // If response isn't JSON, use default message
      }
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.code = response.status === 404 ? "gmail_not_connected" : "unknown";
      throw error;
    }
    
    const data = await response.json();
    // Handle case where API returns {messages: []} or just []
    return Array.isArray(data) ? data : (data.messages || []);
  } catch (error) {
    // Graceful degradation: return empty array instead of throwing
    // This prevents console errors and dashboard crashes
    console.warn("Gmail messages unavailable:", error.message || "Unknown error");
    return [];
  }
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