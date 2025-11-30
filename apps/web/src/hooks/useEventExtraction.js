import { useCallback, useState } from "react";
import { apiFetch } from "../services/apiClient.js";

export function useEventExtraction(emailId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const extract = useCallback(async () => {
    if (!emailId) throw new Error("emailId is required");
    setLoading(true);
    setError("");
    try {
      const cacheKey = `break_event_extract_${emailId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        setData(parsed);
        setLoading(false);
        return parsed;
      }
      const res = await apiFetch("/ai/extract-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId })
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.message || "Unable to extract event");
      }
      setData(payload);
      localStorage.setItem(cacheKey, JSON.stringify(payload));
      return payload;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to extract event");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [emailId]);

  return { data, loading, error, extract };
}
