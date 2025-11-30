import { useCallback, useState } from "react";
import { apiFetch } from "../services/apiClient.js";

export function useFileInsights() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const extractInsights = useCallback(async (fileId) => {
    if (!fileId) return null;
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/ai/file-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId })
      });
      const payload = await res.json();
      if (!res.ok || payload?.success === false) {
        throw new Error(payload?.message || "Unable to extract insights");
      }
      setData(payload);
      return payload;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to extract insights");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError("");
  }, []);

  return { loading, error, data, extractInsights, reset };
}
