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
      if (response.status === 403 || response.status === 404) {
        setLogs([]);
        setError("");
        return;
      }
      if (!response.ok) {
        console.warn("Audit logs request failed:", response.status);
        setLogs([]);
        setError("");
        return;
      }
      const payload = await response.json();
      setLogs(payload.logs ?? []);
    } catch (err) {
      console.warn("Audit logs error:", err);
      // Silently fail - don't show error to user
      setLogs([]);
      setError("");
    } finally {
      setLoading(false);
    }
  }, [endpoint, hasRole]);

  useEffect(() => {
    load();
  }, [load]);

  return { logs, loading, error, reload: load };
}
