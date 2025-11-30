import { apiFetch } from "../services/apiClient.js";

export function useInboxTriage() {
  async function triageEmail(emailId) {
    const res = await apiFetch(`/inbox/triage/${encodeURIComponent(emailId)}`, { method: "POST" });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload?.message || "Triage failed");
    return payload;
  }

  async function triageUser(userId) {
    const res = await apiFetch(`/inbox/triage/user/${encodeURIComponent(userId)}`, { method: "POST" });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload?.message || "Triage failed");
    return payload;
  }

  return { triageEmail, triageUser };
}
