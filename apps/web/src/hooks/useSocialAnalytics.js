import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../services/apiClient.js";

export function useSocialAnalytics(userId, { autoRefresh = false } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState("");

  const load = useCallback(
    async (refresh = false) => {
      if (!userId) return;
      setLoading(true);
      setError("");
      try {
        const endpoint = refresh ? `/social/${userId}/refresh` : `/social/${userId}`;
        const response = await apiFetch(endpoint);
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Session expired. Sign in again.");
          }
          throw new Error("Unable to load social analytics.");
        }
        const payload = await response.json();
        setData(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load social data.");
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    if (userId) {
      load(false);
    }
  }, [userId, load]);

  useEffect(() => {
    if (!autoRefresh || !userId) return undefined;
    const timer = setInterval(() => load(false), 1000 * 60 * 10);
    return () => clearInterval(timer);
  }, [autoRefresh, load, userId]);

  return {
    data,
    loading,
    error,
    refresh: () => load(true)
  };
}
