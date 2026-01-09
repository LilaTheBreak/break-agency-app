import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface SnapshotData {
  snapshotId: string;
  title: string;
  metricType: string;
  value: any;
  description?: string;
  error?: string;
  icon?: string;
  color?: string;
}

interface SnapshotConfig {
  snapshotId: string;
  enabled: boolean;
  order: number;
}

interface DashboardConfigResponse {
  userId: string;
  dashboardType: string;
  snapshots: SnapshotConfig[];
  customizations?: Record<string, any>;
}

/**
 * Hook to manage dashboard customization
 *
 * Usage:
 * const { config, snapshots, isLoading, updateConfig, resetConfig } =
 *   useDashboardCustomization("ADMIN_OVERVIEW");
 */
export function useDashboardCustomization(dashboardType: string) {
  const queryClient = useQueryClient();
  const [customizationOpen, setCustomizationOpen] = useState(false);

  // Fetch dashboard config
  const { data: config, isLoading: isLoadingConfig } = useQuery<DashboardConfigResponse>({
    queryKey: ["dashboard-config", dashboardType],
    queryFn: async () => {
      const res = await fetch(
        `/api/dashboard/config?dashboardType=${encodeURIComponent(dashboardType)}`
      );
      if (!res.ok) throw new Error("Failed to fetch dashboard config");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch snapshot data
  const { data: snapshots, isLoading: isLoadingSnapshots } = useQuery<SnapshotData[]>({
    queryKey: ["dashboard-snapshots", dashboardType],
    queryFn: async () => {
      const res = await fetch(
        `/api/dashboard/snapshots?dashboardType=${encodeURIComponent(dashboardType)}`
      );
      if (!res.ok) throw new Error("Failed to fetch snapshot data");
      return res.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!config, // Only fetch when config is loaded
  });

  // Fetch available snapshots
  const { data: availableSnapshots } = useQuery({
    queryKey: ["available-snapshots", dashboardType],
    queryFn: async () => {
      const res = await fetch(
        `/api/dashboard/snapshots/available?dashboardType=${encodeURIComponent(
          dashboardType
        )}`
      );
      if (!res.ok) throw new Error("Failed to fetch available snapshots");
      return res.json();
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Update config
  const updateConfigMutation = useMutation({
    mutationFn: async (newSnapshots: SnapshotConfig[]) => {
      const res = await fetch("/api/dashboard/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dashboardType,
          snapshots: newSnapshots,
        }),
      });
      if (!res.ok) throw new Error("Failed to update dashboard config");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-config", dashboardType] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-snapshots", dashboardType] });
    },
  });

  // Reset to defaults
  const resetConfigMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/dashboard/config/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboardType }),
      });
      if (!res.ok) throw new Error("Failed to reset dashboard config");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-config", dashboardType] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-snapshots", dashboardType] });
      setCustomizationOpen(false);
    },
  });

  // Combine config snapshots with available snapshots for UI
  const snapshotItems = config?.snapshots.map((s) => {
    const available = availableSnapshots?.find(
      (a: any) => a.id === s.snapshotId
    );
    return {
      snapshotId: s.snapshotId,
      enabled: s.enabled,
      order: s.order,
      title: available?.title || s.snapshotId,
      description: available?.description,
      icon: available?.icon,
      color: available?.color,
      category: available?.category,
      helpText: available?.helpText,
    };
  }) || [];

  return {
    config,
    snapshots: snapshots || [],
    snapshotItems,
    availableSnapshots: availableSnapshots || [],
    isLoading: isLoadingConfig || isLoadingSnapshots,
    isUpdating: updateConfigMutation.isPending,
    isResetting: resetConfigMutation.isPending,
    customizationOpen,
    setCustomizationOpen,
    updateConfig: (newSnapshots: SnapshotConfig[]) =>
      updateConfigMutation.mutateAsync(newSnapshots),
    resetConfig: () => resetConfigMutation.mutateAsync(),
  };
}

export default useDashboardCustomization;
