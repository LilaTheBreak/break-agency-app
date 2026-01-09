import { useState, useEffect } from "react";
import { apiFetch } from "../services/apiClient.js";

/**
 * Snapshot data returned from API
 */
export interface SnapshotData {
  snapshotId: string;
  title: string;
  metricType: "count" | "currency" | "percentage" | "status" | "list" | "custom";
  value: any;
  description?: string;
  icon?: string;
  color?: "blue" | "green" | "purple" | "amber" | "red" | "pink";
  error?: string;
  meta?: {
    currency?: string;
    generatedAt?: string;
  };
}

interface UseSnapshotsOptions {
  dashboardType: "ADMIN_OVERVIEW" | "TALENT_OVERVIEW" | "EXCLUSIVE_TALENT_OVERVIEW";
  talentId?: string; // For admin viewing a talent
}

/**
 * Hook for fetching and managing snapshot data
 *
 * Responsibilities:
 * - Fetch snapshots from /api/dashboard/snapshots
 * - Filter by dashboard type
 * - Handle loading and error states
 * - Support admin viewing specific talent's snapshots
 */
export function useSnapshots(options: UseSnapshotsOptions) {
  const [snapshots, setSnapshots] = useState<SnapshotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { dashboardType, talentId } = options;

  useEffect(() => {
    if (!dashboardType) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const controller = new AbortController();

    async function fetchSnapshots() {
      try {
        setLoading(true);
        setError(null);

        // Build query params
        const params = new URLSearchParams({
          dashboardType,
          ...(talentId && { talentId }),
        });

        const response = await apiFetch(
          `/api/dashboard/snapshots?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch snapshots: ${response.status}`);
        }

        const data = await response.json();

        if (mounted) {
          // data should be an array of SnapshotData
          setSnapshots(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("useSnapshots error:", err);
          if (mounted) {
            setError(
              err instanceof Error ? err.message : "Failed to fetch snapshots"
            );
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchSnapshots();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [dashboardType, talentId]);

  return { snapshots, loading, error };
}
