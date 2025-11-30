import { useState } from "react";
import { apiFetch } from "../services/apiClient.js";

export function useDealNegotiation(dealId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const generate = async () => {
    if (!dealId) return null;
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/deal-negotiation/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId })
      });
      const payload = await res.json();
      if (!res.ok || payload?.error) throw new Error(payload?.message || "Unable to generate advice");
      setData(payload.data);
      return payload.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate advice");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, data, generate };
}
