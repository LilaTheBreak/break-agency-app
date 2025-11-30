import { apiFetch } from "../services/apiClient.js";

export function useNegotiation() {
  async function triggerStep(sessionId, step = "initial") {
    const res = await apiFetch(`/negotiation/${encodeURIComponent(sessionId)}/step`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step })
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload?.message || "Failed to queue negotiation step");
    return payload;
  }

  return { triggerStep };
}
