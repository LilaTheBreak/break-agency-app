import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../services/apiClient.js";

export function useAdminActivityFeed({ interval = 10000 } = {}) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sinceRef = useRef(null);

  useEffect(() => {
    let active = true;
    let timer;

    const fetchActivities = async (params = "") => {
      const response = await apiFetch(`/admin/activity/live${params}`, {
        headers: { "x-user-roles": "admin" }
      });
      if (!response.ok) throw new Error("Unable to load admin activity");
      const payload = await response.json();
      return payload.activities || [];
    };

    const loadInitial = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchActivities("");
        if (!active) return;
        setActivities(data);
        sinceRef.current = data[0]?.createdAt ?? null;
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load admin activity");
      } finally {
        if (active) setLoading(false);
      }
    };

    const poll = async () => {
      try {
        const since = sinceRef.current ? `?since=${encodeURIComponent(sinceRef.current)}` : "";
        const data = await fetchActivities(since);
        if (!active || !data.length) return;
        sinceRef.current = data[0].createdAt;
        setActivities((prev) => {
          const merged = [...data, ...prev];
          return merged.slice(0, 100);
        });
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load admin activity");
      }
    };

    loadInitial();
    timer = setInterval(poll, interval);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [interval]);

  return { activities, loading, error };
}
