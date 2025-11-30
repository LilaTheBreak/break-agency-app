import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/apiClient.js";

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export function usePriorityInbox() {
  const [inbox, setInbox] = useState([]);
  const [totals, setTotals] = useState({ high: 0, medium: 0, low: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sortInbox = useCallback((items) => {
    return [...items].sort((a, b) => {
      const pDiff = (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3);
      if (pDiff !== 0) return pDiff;
      const dateA = a.parsed?.date ? new Date(a.parsed.date).getTime() : 0;
      const dateB = b.parsed?.date ? new Date(b.parsed.date).getTime() : 0;
      return dateB - dateA;
    });
  }, []);

  const fetchInbox = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/inbox/unified");
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.message || "Unable to load priority inbox");
      }
      const sorted = sortInbox(payload.inbox || []);
      setInbox(sorted);
      setTotals(payload.totals || { high: 0, medium: 0, low: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load priority inbox");
    } finally {
      setLoading(false);
    }
  }, [sortInbox]);

  useEffect(() => {
    fetchInbox();
    const interval = setInterval(fetchInbox, 1000 * 60 * 2);
    return () => clearInterval(interval);
  }, [fetchInbox]);

  const value = useMemo(
    () => ({ inbox, totals, loading, error, refresh: fetchInbox }),
    [inbox, totals, loading, error, fetchInbox]
  );

  return value;
}
