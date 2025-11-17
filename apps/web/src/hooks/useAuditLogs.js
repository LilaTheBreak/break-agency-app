import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../services/apiClient.js";

export function useAuditLogs({ userId, limit = 50, entityType } = {}) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const endpoint = (() => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (userId) params.set("userId", userId);
    if (entityType) params.set("entityType", entityType);
    return `/audit?${params.toString()}`;
  })();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch(endpoint, {
        headers: {
          "x-user-roles": "admin"
        }
      });
      if (!response.ok) {
        throw new Error("Unable to load audit logs");
      }
      const payload = await response.json();
      setLogs(payload.logs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    load();
  }, [load]);

  return { logs, loading, error, reload: load };
}
