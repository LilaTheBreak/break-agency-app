import { useCallback, useState } from "react";
import { apiFetch } from "../services/apiClient.js";

export function useSocialInsights() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [insights, setInsights] = useState(null);

  const generateInsights = useCallback(async (userId) => {
    if (!userId) return null;
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`/ai/social-insights/${encodeURIComponent(userId)}`, {
        method: "POST"
      });
      const payload = await res.json();
      if (!res.ok || payload?.success === false) {
        throw new Error(payload?.message || "Unable to generate insights");
      }
      setInsights(payload.breakdown || null);
      return payload.breakdown || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate insights");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, insights, generateInsights };
}
