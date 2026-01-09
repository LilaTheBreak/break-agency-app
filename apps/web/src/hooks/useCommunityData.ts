/**
 * useCommunityData Hook
 * 
 * TanStack Query hooks for community management data
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface CommunityConnection {
  id: string;
  talentId: string;
  platform: "instagram" | "tiktok" | "twitter" | "youtube" | "linkedin" | "discord" | "threads";
  status: "connected" | "pending" | "error" | "inactive";
  accountHandle?: string;
  followers: number;
  lastSyncedAt?: string;
  error?: string;
  metadata?: Record<string, any>;
}

interface Metric {
  id: string;
  connectionId: string;
  talentId: string;
  platform: string;
  metricType:
    | "engagement_rate"
    | "comments_vs_likes"
    | "saves_shares"
    | "repeat_commenters"
    | "response_velocity";
  value: number;
  period: "day" | "week" | "month" | "lifetime";
  data?: Record<string, any>;
  calculatedAt?: string;
}

interface CommunitySnapshot {
  connectedPlatforms: number;
  totalAudience: number;
  engagementHealth: "Low" | "Stable" | "Strong";
  avgEngagementRate: number;
  mostEngagedPlatform?: string;
  connections: CommunityConnection[];
  metrics: Metric[];
}

/**
 * Get community snapshot for a talent
 */
export const useCommunitySnapshot = (talentId: string | undefined) => {
  return useQuery({
    queryKey: ["community", "snapshot", talentId],
    queryFn: async () => {
      if (!talentId) return null;
      const response = await fetch(`/api/community/${talentId}/snapshot`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch community snapshot");
      }
      const data = await response.json();
      return data.snapshot as CommunitySnapshot;
    },
    enabled: !!talentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Get all connections for a talent
 */
export const useCommunityConnections = (talentId: string | undefined) => {
  return useQuery({
    queryKey: ["community", "connections", talentId],
    queryFn: async () => {
      if (!talentId) return { connections: [], hasConnectedAccounts: false };
      const response = await fetch(`/api/community/${talentId}/connections`);
      if (!response.ok) {
        if (response.status === 404) return { connections: [], hasConnectedAccounts: false };
        throw new Error("Failed to fetch connections");
      }
      return response.json();
    },
    enabled: !!talentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Connect a new social account
 */
export const useConnectAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      talentId,
      platform,
      accountHandle,
      metadata,
    }: {
      talentId: string;
      platform: string;
      accountHandle?: string;
      metadata?: Record<string, any>;
    }) => {
      const response = await fetch(`/api/community/${talentId}/connections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, accountHandle, metadata }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to connect account");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["community", "snapshot", variables.talentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["community", "connections", variables.talentId],
      });
    },
  });
};

/**
 * Disconnect a social account
 */
export const useDisconnectAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ connectionId, talentId }: { connectionId: string; talentId: string }) => {
      const response = await fetch(`/api/community/${connectionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to disconnect account");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["community", "snapshot", variables.talentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["community", "connections", variables.talentId],
      });
    },
  });
};

/**
 * Update engagement metric for a connection
 */
export const useUpdateMetric = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      connectionId,
      talentId,
      metricType,
      period,
      value,
      data,
    }: {
      connectionId: string;
      talentId: string;
      metricType: string;
      period: "day" | "week" | "month" | "lifetime";
      value: number;
      data?: Record<string, any>;
    }) => {
      const response = await fetch(`/api/community/${connectionId}/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metricType, period, value, data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update metric");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["community", "snapshot", variables.talentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["community", "connections", variables.talentId],
      });
    },
  });
};

/**
 * Mark connection as connected (admin/integration use)
 */
export const useMarkConnected = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      connectionId,
      talentId,
      followers,
      metadata,
    }: {
      connectionId: string;
      talentId: string;
      followers?: number;
      metadata?: Record<string, any>;
    }) => {
      const response = await fetch(`/api/community/${connectionId}/mark-connected`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followers, metadata }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to mark connection");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["community", "snapshot", variables.talentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["community", "connections", variables.talentId],
      });
    },
  });
};
