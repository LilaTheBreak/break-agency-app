import { apiFetch } from "../services/apiClient.js";

export function useAgent() {
  async function runAgent(email) {
    const res = await apiFetch("/agent/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    return res.json();
  }

  return { runAgent };
}
