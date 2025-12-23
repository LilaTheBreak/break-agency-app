import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../services/apiClient.js";
import { useAuth } from "../context/AuthContext.jsx";

export function useAuditLogs({ userId, limit = 50, entityType } = {}) {
  const { hasRole } = useAuth();
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
    // Check role before making API call
    if (!hasRole("ADMIN", "SUPERADMIN")) {
      setLogs([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await apiFetch(endpoint);
      if (response.status === 403) {
        setLogs([]);
        setError("");
        return;
      }
      if (!response.ok) {
        throw new Error("Unable to load audit logs");
      }
      const payload = await response.json();
      setLogs(payload.logs ?? []);
    } catch (err) {
      console.error("Audit logs error:", err);
      setError(err instanceof Error ? err.message : "Unable to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [endpoint, hasRole]);

  useEffect(() => {
    load();
  }, [load]);

  return { logs, loading, error, reload: load };
}
