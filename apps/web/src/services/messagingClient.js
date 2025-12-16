import { apiFetch } from "./apiClient.js";

export async function fetchThreads() {
  const response = await apiFetch("/api/threads");
  if (!response.ok) {
    throw new Error("Unable to load messages");
  }
  return response.json();
}

export async function sendMessage(threadId, body) {
  const response = await apiFetch("/api/messages", {
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
  const response = await apiFetch(`/api/messages/${encodeURIComponent(messageId)}/read`, {
    method: "PATCH"
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Unable to update message");
  }
  return response.json();
}
