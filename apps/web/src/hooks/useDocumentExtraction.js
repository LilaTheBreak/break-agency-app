import { useCallback, useState } from "react";
import { apiFetch } from "../services/apiClient.js";

export function useDocumentExtraction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [text, setText] = useState("");

  const extract = useCallback(async (fileId) => {
    if (!fileId) return "";
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`/documents/${encodeURIComponent(fileId)}/text`);
      const payload = await res.json();
      if (!res.ok || payload?.success === false) {
        throw new Error(payload?.message || "Unable to extract text");
      }
      setText(payload.text || "");
      return payload.text || "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to extract text");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, text, extract };
}
