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