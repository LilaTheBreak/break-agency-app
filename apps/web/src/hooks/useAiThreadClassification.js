import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../services/apiClient.js";

export function useAiThreadClassification(threadId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/ai/classify-thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId })
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.message || "Unable to classify thread");
      }
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to classify thread");
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!threadId) return undefined;
    const id = setInterval(fetchData, 45_000);
    return () => clearInterval(id);
  }, [threadId, fetchData]);

  return { loading, error, data, refresh: fetchData };
}
