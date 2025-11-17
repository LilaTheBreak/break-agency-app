import { useEffect, useState } from "react";
import { apiFetch } from "../services/apiClient.js";

export function usePayoutSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await apiFetch("/payouts/summary");
        if (!response.ok) throw new Error("Unable to load payouts");
        const payload = await response.json();
        if (active) setData(payload);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load payouts");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
}
