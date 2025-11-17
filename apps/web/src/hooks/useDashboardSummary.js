import { useEffect, useState } from "react";
import { apiFetch } from "../services/apiClient.js";

export function useDashboardSummary(role) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(Boolean(role));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!role) {
      setSummary(null);
      setLoading(false);
      setError("");
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    const load = async () => {
      try {
        const response = await apiFetch(`/dashboard/${encodeURIComponent(role)}`);
        if (!response.ok) {
          throw new Error("Unable to load dashboard metrics");
        }
        const payload = await response.json();
        if (active) {
          setSummary(payload);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load dashboard metrics");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [role]);

  return { summary, loading, error };
}
