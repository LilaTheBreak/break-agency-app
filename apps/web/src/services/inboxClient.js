import { apiFetch } from "./apiClient.js";

export const scanInbox = async () => {
  const response = await apiFetch("/api/inbox/scan", { method: "POST" });
  if (!response.ok) throw new Error("Failed to trigger inbox scan");
  return response.json();
};

export const getPriorityInbox = async () => {
  const response = await apiFetch("/api/inbox/priority");
  if (!response.ok) throw new Error("Failed to fetch priority inbox");
  return response.json();
};

export const getAwaitingReply = async () => {
  const response = await apiFetch("/api/inbox/awaiting-reply");
  if (!response.ok) throw new Error("Failed to fetch awaiting reply messages");
  return response.json();
};

/**
 * Fetch recent inbox messages
 * @param {number} limit - Number of messages to fetch (default: 10)
 * @returns {Promise<{success: boolean, data?: Array, status?: number, error?: string}>}
 */
export const getRecentInbox = async (limit = 10) => {
  try {
    const response = await apiFetch(`/api/gmail/inbox?limit=${limit}&page=1`);
    
    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: response.status === 404 
          ? "gmail_not_connected" 
          : "Failed to fetch inbox"
      };
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("getRecentInbox error:", error);
    return { 
      success: false, 
      status: 500, 
      error: error.message || "Network error" 
    };
  }
};