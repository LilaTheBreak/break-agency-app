import { useState, useEffect } from "react";
import { getDashboardStats } from "../services/dashboardClient.js";

export function useDashboardSummary(role) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch for roles that should see the summary
    if (role !== "ADMIN" && role !== "SUPERADMIN") {
      console.log("[useDashboardSummary] Skipping fetch for role:", role);
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      try {
        console.log("[useDashboardSummary] Fetching dashboard stats...");
        const stats = await getDashboardStats();
        console.log("[useDashboardSummary] Received stats:", stats);
        setSummary(stats);
      } catch (err) {
        console.error("[useDashboardSummary] Error fetching stats:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [role]);

  return { summary, loading, error };
}