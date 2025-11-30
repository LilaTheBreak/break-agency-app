import { apiFetch } from "./apiClient.js";

export async function fetchThreads() {
  const response = await apiFetch("/messages/threads");
  if (!response.ok) {
    throw new Error("Unable to load messages");
  }
  return response.json();
}

export async function fetchThread(userId) {
  const response = await apiFetch(`/messages/thread/${encodeURIComponent(userId)}`);
  if (!response.ok) {
    throw new Error("Unable to load thread");
  }
  return response.json();
}

export async function sendMessage({ recipientId, content }) {
  const response = await apiFetch("/messages/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ recipientId, content })
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
