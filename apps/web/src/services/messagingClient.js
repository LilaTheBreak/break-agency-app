import { apiFetch } from "./apiClient.js";

export async function fetchThreads() {
  try {
    const response = await apiFetch("/threads");
    
    if (!response.ok) {
      // Graceful handling: return empty threads, no errors thrown
      return { threads: [], status: response.status };
    }
    
    return await response.json();
  } catch (err) {
    // Network error or JSON parse error - return empty gracefully
    return { threads: [], status: 'error', error: err.message };
  }
}

export async function sendMessage(threadId, body) {
  try {
    const response = await apiFetch("/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ threadId, body })
    });
    
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { success: false, error: text || "Unable to send message" };
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message || "Network error" };
  }
}

export async function markMessageRead(messageId) {
  try {
    const response = await apiFetch(`/messages/${encodeURIComponent(messageId)}/read`, {
      method: "PATCH"
    });
    
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { success: false, error: text || "Unable to update message" };
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message || "Network error" };
  }
}
