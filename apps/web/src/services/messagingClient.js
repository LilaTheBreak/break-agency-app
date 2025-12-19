import { apiFetch } from "./apiClient.js";

export async function fetchThreads() {
  try {
    const response = await apiFetch("/threads");
    if (!response.ok) {
      throw new Error("Unable to load messages");
    }
    return response.json();
  } catch (err) {
    console.warn("Falling back to local threads", err);
    return { threads: [] };
  }
}

export async function sendMessage(threadId, body) {
  const response = await apiFetch("/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ threadId, body })
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Unable to send message");
  }
  return response.json();
}

export async function markMessageRead(messageId) {
  const response = await apiFetch(`/messages/${encodeURIComponent(messageId)}/read`, {
    method: "PATCH"
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Unable to update message");
  }
  return response.json();
}
