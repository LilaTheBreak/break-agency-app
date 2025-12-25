import { useCallback, useState } from "react";
import { apiFetch } from "../services/apiClient.js";

export function useGmailAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const getAuthUrl = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch("/api/gmail/auth/url");
      const payload = await response.json();
      if (!response.ok || !payload.url) {
        throw new Error(payload?.message || "Unable to get Gmail auth URL");
      }
      setStatus("url-ready");
      return payload.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to get Gmail auth URL");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const connectGmail = useCallback(async () => {
    const url = await getAuthUrl();
    if (url) {
      window.location.assign(url);
    }
  }, [getAuthUrl]);

  const ingestEmails = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch("/api/gmail/ingest", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Unable to ingest Gmail");
      }
      setStatus(`processed:${payload.processed ?? 0}`);
      return payload;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to ingest Gmail");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    status,
    getAuthUrl,
    connectGmail,
    ingestEmails
  };
}
