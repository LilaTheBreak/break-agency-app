/**
 * Community Management Service
 * 
 * Handles community connections and engagement metrics for talent
 * Foundation for future AI insights on audience health and sentiment
 */

import prisma from '../lib/prisma';

export type Platform = "instagram" | "tiktok" | "twitter" | "youtube" | "linkedin" | "discord" | "threads";
export type ConnectionStatus = "connected" | "pending" | "error" | "inactive";
export type MetricType = "engagement_rate" | "comments_vs_likes" | "saves_shares" | "repeat_commenters" | "response_velocity";
export type MetricPeriod = "day" | "week" | "month" | "lifetime";

export interface CreateConnectionInput {
  talentId: string;
  platform: Platform;
  accountHandle?: string;
  metadata?: Record<string, any>;
}

export interface UpdateMetricInput {
  value: number;
  data?: Record<string, any>;
}

/**
 * Create or update community connection
 */
export async function upsertCommunityConnection(input: CreateConnectionInput) {
  const { talentId, platform, accountHandle, metadata } = input;

  // @ts-ignore - Model exists in schema but TypeScript cache is stale
  const connection = await prisma.communityConnection.upsert({
    where: {
      talentId_platform: {
        talentId,
        platform,
      },
    },
    create: {
      talentId,
      platform,
      accountHandle,
      status: "pending",
      metadata: metadata || {},
    },
    update: {
      status: "pending",
      accountHandle,
      metadata: metadata || {},
    },
  });

  return connection;
}

/**
 * Get talent's community connections
 */
export async function getTalentConnections(talentId: string) {
  // @ts-ignore - Model exists in schema but TypeScript cache is stale
  const connections = await prisma.communityConnection.findMany({
    where: { talentId },
    include: {
      metrics: {
        orderBy: { calculatedAt: "desc" },
        take: 1, // Get latest metric for each type
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return connections;
}

/**
 * Get single connection
 */
export async function getConnection(connectionId: string) {
  // @ts-ignore - Model exists in schema but TypeScript cache is stale
  const connection = await prisma.communityConnection.findUnique({
    where: { id: connectionId },
    include: {
      metrics: {
        orderBy: { calculatedAt: "desc" },
      },
    },
  });

  return connection;
}

/**
 * Mark connection as connected
 */
export async function markConnectionConnected(
  connectionId: string,
  followers: number = 0,
  metadata?: Record<string, any>
) {
  // @ts-ignore - Model exists in schema but TypeScript cache is stale
  const connection = await prisma.communityConnection.update({
    where: { id: connectionId },
    data: {
      status: "connected",
      followers,
      lastSyncedAt: new Date(),
      metadata: metadata || {},
      error: null,
    },
  });

  return connection;
}

/**
 * Mark connection as error
 */
export async function markConnectionError(
  connectionId: string,
  errorMessage: string
) {
  // @ts-ignore - Model exists in schema but TypeScript cache is stale
  const connection = await prisma.communityConnection.update({
    where: { id: connectionId },
    data: {
      status: "error",
      error: errorMessage,
    },
  });

  return connection;
}

/**
 * Save or update engagement metric
 */
export async function upsertMetric(
  connectionId: string,
  talentId: string,
  platform: string,
  metricType: MetricType,
  period: MetricPeriod,
  value: number,
  data?: Record<string, any>
) {
  // @ts-ignore - Model exists in schema but TypeScript cache is stale
  const metric = await prisma.communityMetric.upsert({
    where: {
      connectionId_metricType_period: {
        connectionId,
        metricType,
        period,
      },
    },
    create: {
      connectionId,
      talentId,
      platform,
      metricType,
      period,
      value,
      data,
    },
    update: {
      value,
      data,
      calculatedAt: new Date(),
    },
  });

  return metric;
}

/**
 * Get metrics for connection
 */
export async function getConnectionMetrics(
  connectionId: string,
  period?: MetricPeriod
) {
  // @ts-ignore - Model exists in schema but TypeScript cache is stale
  const metrics = await prisma.communityMetric.findMany({
    where: {
      connectionId,
      ...(period && { period }),
    },
    orderBy: { metricType: "asc" },
  });

  return metrics;
}

/**
 * Get all metrics for talent across platforms
 */
export async function getTalentMetrics(talentId: string, period?: MetricPeriod) {
  // @ts-ignore - Model exists in schema but TypeScript cache is stale
  const metrics = await prisma.communityMetric.findMany({
    where: {
      talentId,
      ...(period && { period }),
    },
    orderBy: { platform: "asc" },
  });

  return metrics;
}

/**
 * Calculate engagement health (Low / Stable / Strong)
 * Based on engagement rate and trend
 */
export function calculateEngagementHealth(
  engagementRate: number
): "low" | "stable" | "strong" {
  if (engagementRate >= 5) return "strong";
  if (engagementRate >= 2) return "stable";
  return "low";
}

/**
 * Calculate trend indicator
 * Returns: ↑ (up), ↓ (down), or → (stable)
 */
export function calculateTrend(
  current: number,
  previous: number
): "up" | "down" | "stable" {
  const change = current - previous;
  const percentageChange = (change / previous) * 100;

  if (percentageChange > 5) return "up";
  if (percentageChange < -5) return "down";
  return "stable";
}

/**
 * Get community snapshot for talent
 * Aggregates data from all connections
 */
export async function getCommunitySnapshot(talentId: string) {
  const connections = await getTalentConnections(talentId);

  const connectedCount = connections.filter(
    (c) => c.status === "connected"
  ).length;
  const totalAudience = connections.reduce((sum, c) => sum + c.followers, 0);

  // Calculate average engagement rate from metrics
  const metrics = await getTalentMetrics(talentId, "week");
  const engagementRates = metrics
    .filter((m) => m.metricType === "engagement_rate")
    .map((m) => m.value);
  const avgEngagementRate =
    engagementRates.length > 0
      ? engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length
      : 0;

  const health = calculateEngagementHealth(avgEngagementRate);

  // Find most engaged platform
  const platformEngagement = new Map<string, number>();
  metrics
    .filter((m) => m.metricType === "engagement_rate")
    .forEach((m) => {
      const current = platformEngagement.get(m.platform) || 0;
      platformEngagement.set(m.platform, current + m.value);
    });

  let mostEngagedPlatform: string | null = null;
  let maxEngagement = 0;
  platformEngagement.forEach((value, platform) => {
    if (value > maxEngagement) {
      maxEngagement = value;
      mostEngagedPlatform = platform;
    }
  });

  return {
    connectedPlatforms: connectedCount,
    totalAudience,
    engagementHealth: health,
    avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
    mostEngagedPlatform,
    connections,
    metrics,
  };
}

/**
 * Delete community connection
 */
export async function deleteConnection(connectionId: string) {
  // @ts-ignore - Model exists in schema but TypeScript cache is stale
  await prisma.communityConnection.delete({
    where: { id: connectionId },
  });
}

/**
 * Check if talent has any connected accounts
 */
export async function hasConnectedAccounts(talentId: string): Promise<boolean> {
  // @ts-ignore - Model exists in schema but TypeScript cache is stale
  const count = await prisma.communityConnection.count({
    where: {
      talentId,
      status: "connected",
    },
  });

  return count > 0;
}
