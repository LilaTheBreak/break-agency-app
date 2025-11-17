import { apiFetch } from "./apiClient.js";

function buildAuthHeaders(session) {
  if (!session?.email) return {};
  const headers = { "x-user-id": session.email };
  if (session.roles?.length) {
    headers["x-user-roles"] = session.roles.join(",");
  }
  return headers;
}

export async function fetchThreads(session) {
  const response = await apiFetch("/messages/threads", {
    headers: {
      ...buildAuthHeaders(session)
    }
  });
  if (!response.ok) {
    throw new Error("Unable to load messages");
  }
  return response.json();
}

export async function fetchThread(session, userId) {
  const response = await apiFetch(`/messages/thread/${encodeURIComponent(userId)}`, {
    headers: {
      ...buildAuthHeaders(session)
    }
  });
  if (!response.ok) {
    throw new Error("Unable to load thread");
  }
  return response.json();
}

export async function sendMessage(session, { recipientId, content }) {
  const response = await apiFetch("/messages/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(session)
    },
    body: JSON.stringify({ recipientId, content })
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Unable to send message");
  }
  return response.json();
}

export async function markMessageRead(session, messageId) {
  const response = await apiFetch(`/messages/${encodeURIComponent(messageId)}/read`, {
    method: "PATCH",
    headers: {
      ...buildAuthHeaders(session)
    }
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Unable to update message");
  }
  return response.json();
}
