import { useState, useEffect } from "react";
import { getDashboardStats } from "../services/dashboardClient.js";

export function useDashboardSummary(role) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch for roles that should see the summary
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      try {
        const stats = await getDashboardStats();
        setSummary(stats);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [role]);

  return { summary, loading, error };
}