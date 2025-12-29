import { useCallback, useState } from "react";
import { apiFetch } from "../services/apiClient.js";

export function useFileUploads() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestUploadUrl = useCallback(async ({ filename, contentType }) => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/files/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, contentType })
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || "Unable to get upload URL");
      return payload;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to get upload URL");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmUpload = useCallback(async ({ fileKey, filename, type }) => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/files/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileKey, filename, type })
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || "Unable to confirm upload");
      return payload.file;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to confirm upload");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const listFiles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/files");
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || "Unable to list files");
      return payload.files || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to list files");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDownloadUrl = useCallback(async (id) => {
    const res = await apiFetch(`/api/files/${encodeURIComponent(id)}/download`);
    const payload = await res.json();
    if (!res.ok) throw new Error(payload?.message || "Unable to get download URL");
    return payload.url;
  }, []);

  return { loading, error, requestUploadUrl, confirmUpload, listFiles, getDownloadUrl };
}
