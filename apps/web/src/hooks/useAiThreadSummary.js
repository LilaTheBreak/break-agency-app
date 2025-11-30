import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../services/apiClient.js";

export function useAiThreadSummary(threadId) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSummary = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/ai/summarise-thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId })
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.message || "Unable to load AI summary");
      }
      setSummary(payload.summary || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load AI summary");
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (!threadId) return undefined;
    const id = setInterval(fetchSummary, 30_000);
    return () => clearInterval(id);
  }, [threadId, fetchSummary]);

  return { summary, loading, error, refresh: fetchSummary };
}
