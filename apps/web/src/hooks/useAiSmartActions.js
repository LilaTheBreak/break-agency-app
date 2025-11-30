import { useCallback, useState } from "react";
import { apiFetch } from "../services/apiClient.js";

const VALID_INTENTS = ["accept", "decline", "negotiate", "custom"];

export function useAiSmartActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateReply = useCallback(async ({ threadId, intent }) => {
    if (!threadId) throw new Error("threadId required");
    if (!VALID_INTENTS.includes(intent)) throw new Error("Invalid intent");
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/ai/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, intent })
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.message || "Unable to generate reply");
      }
      return payload.draft || "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate reply");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { generateReply, loading, error };
}
