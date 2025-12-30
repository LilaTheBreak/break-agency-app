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
 * Check Gmail connection status
 * @returns {Promise<{connected: boolean}>}
 */
export const getGmailStatus = async () => {
  try {
    const response = await apiFetch("/api/gmail/auth/status");
    if (!response.ok) {
      return { connected: false };
    }
    return response.json();
  } catch (error) {
    return { connected: false };
  }
};

/**
 * Trigger Gmail inbox sync
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const syncGmailInbox = async () => {
  try {
    const response = await apiFetch("/api/gmail/inbox/sync", { method: "POST" });
    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = "Sync failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If response isn't JSON, use default message
      }
      return { success: false, message: errorMessage };
    }
    const data = await response.json();
    // Return full response including stats and summary
    return { 
      success: data.success !== false, // Handle case where success: false but 200 OK
      ...data 
    };
  } catch (error) {
    return { success: false, message: error.message || "Network error" };
  }
};

/**
 * Fetch recent inbox messages with auto-sync support
 * @param {number} limit - Number of messages to fetch (default: 10)
 * @param {boolean} autoSync - Auto-trigger sync if inbox is empty (default: true)
 * @returns {Promise<{success: boolean, data?: Array, status?: number, error?: string, needsSync?: boolean}>}
 */
export const getRecentInbox = async (limit = 10, autoSync = true) => {
  try {
    // First check if Gmail is connected
    const status = await getGmailStatus();
    if (!status.connected) {
      return {
        success: false,
        status: 404,
        error: "gmail_not_connected",
        needsSync: false
      };
    }

    // Fetch inbox
    const response = await apiFetch(`/api/gmail/inbox?limit=${limit}&page=1`);
    
    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: "Failed to fetch inbox"
      };
    }
    
    const data = await response.json();
    
    // If inbox is empty and autoSync is true, trigger sync
    if (autoSync && Array.isArray(data) && data.length === 0) {
      await syncGmailInbox();
      return {
        success: true,
        data: [],
        needsSync: true,
        message: "Syncing your Gmail inbox... Refresh in a moment."
      };
    }
    
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