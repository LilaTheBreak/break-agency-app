import prisma from "../lib/prisma.js";
import type { RevenueSource, RevenueEvent } from "@prisma/client";
import { logError } from "../lib/logger.js";

/**
 * RevenueSourceService
 * 
 * Manages revenue sources for exclusive talent
 * Supports multiple platforms: Shopify, TikTok Shop, LTK, Amazon, Custom
 */

// Supported revenue platforms
export const REVENUE_PLATFORMS = {
  SHOPIFY: "SHOPIFY",
  TIKTOK_SHOP: "TIKTOK_SHOP",
  LTK: "LTK",
  AMAZON: "AMAZON",
  CUSTOM: "CUSTOM",
} as const;

export type RevenuePlatform = typeof REVENUE_PLATFORMS[keyof typeof REVENUE_PLATFORMS];

/**
 * Create a new revenue source for a talent
 * 
 * @param talentId - The talent's ID
 * @param platform - Revenue platform type
 * @param displayName - User-friendly name (e.g. "The Break Store")
 * @param externalAccountId - Platform-specific account ID
 * @param metadata - Platform-specific configuration
 */
export async function createRevenueSource(
  talentId: string,
  platform: RevenuePlatform,
  displayName: string,
  externalAccountId?: string,
  metadata?: Record<string, any>
): Promise<RevenueSource> {
  // Validate that talent exists and is exclusive
  const talent = await prisma.talent.findUnique({
    where: { id: talentId },
    select: { id: true, representationType: true },
  });

  if (!talent) {
    throw new Error(`Talent ${talentId} not found`);
  }

  if (talent.representationType !== "EXCLUSIVE") {
    throw new Error(`Only EXCLUSIVE talent can add revenue sources. Found: ${talent.representationType}`);
  }

  // Check for duplicate (same talent + platform + account)
  if (externalAccountId) {
    const existing = await prisma.revenueSource.findFirst({
      where: {
        talentId,
        platform,
        externalAccountId,
      },
    });

    if (existing) {
      throw new Error(`Revenue source already exists for ${platform} account ${externalAccountId}`);
    }
  }

  const revenueSource = await prisma.revenueSource.create({
    data: {
      talentId,
      platform,
      displayName,
      externalAccountId,
      status: "CONNECTED",
      metadata,
    },
  });

  return revenueSource;
}

/**
 * Get all revenue sources for a talent
 */
export async function getRevenueSourcesForTalent(talentId: string): Promise<RevenueSource[]> {
  return prisma.revenueSource.findMany({
    where: { talentId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get a specific revenue source
 */
export async function getRevenueSource(sourceId: string): Promise<RevenueSource | null> {
  return prisma.revenueSource.findUnique({
    where: { id: sourceId },
  });
}

/**
 * Update revenue source status or metadata
 */
export async function updateRevenueSource(
  sourceId: string,
  updates: {
    status?: string;
    displayName?: string;
    syncError?: string | null;
    lastSyncedAt?: Date;
    metadata?: Record<string, any>;
  }
): Promise<RevenueSource> {
  return prisma.revenueSource.update({
    where: { id: sourceId },
    data: updates,
  });
}

/**
 * Delete a revenue source (and associated events)
 */
export async function deleteRevenueSource(sourceId: string): Promise<void> {
  // Delete associated events first
  await prisma.revenueEvent.deleteMany({
    where: { revenueSourceId: sourceId },
  });

  // Then delete the source
  await prisma.revenueSource.delete({
    where: { id: sourceId },
  });
}

/**
 * Record a revenue event
 * Idempotent: uses sourceReference for deduplication
 */
export async function recordRevenueEvent(
  revenueSourceId: string,
  date: Date,
  grossAmount: number,
  netAmount: number,
  type: string = "SALE",
  sourceReference?: string,
  metadata?: Record<string, any>,
  currency: string = "GBP"
): Promise<RevenueEvent> {
  // Validate source exists
  const source = await prisma.revenueSource.findUnique({
    where: { id: revenueSourceId },
  });

  if (!source) {
    throw new Error(`Revenue source ${revenueSourceId} not found`);
  }

  // Try to find existing event by sourceReference (deduplication)
  if (sourceReference) {
    const existing = await prisma.revenueEvent.findUnique({
      where: {
        revenueSourceId_sourceReference: {
          revenueSourceId,
          sourceReference,
        },
      },
    });

    if (existing) {
      // Event already recorded, return existing
      return existing;
    }
  }

  // Create new event
  const event = await prisma.revenueEvent.create({
    data: {
      revenueSourceId,
      date,
      grossAmount,
      netAmount,
      type,
      sourceReference,
      metadata,
      currency,
    },
  });

  return event;
}

/**
 * Get revenue events for a source within a date range
 */
export async function getRevenueEventsForSource(
  sourceId: string,
  startDate?: Date,
  endDate?: Date
): Promise<RevenueEvent[]> {
  return prisma.revenueEvent.findMany({
    where: {
      revenueSourceId: sourceId,
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    },
    orderBy: { date: "desc" },
  });
}

/**
 * Get aggregated revenue by source for a talent
 */
export async function getRevenueBySourceForTalent(
  talentId: string,
  startDate?: Date,
  endDate?: Date
): Promise<
  Array<{
    sourceId: string;
    sourceName: string;
    platform: string;
    totalGross: number;
    totalNet: number;
    currency: string;
    eventCount: number;
  }>
> {
  const sources = await getRevenueSourcesForTalent(talentId);

  const results = await Promise.all(
    sources.map(async (source) => {
      const events = await getRevenueEventsForSource(source.id, startDate, endDate);
      const totalGross = events.reduce((sum, e) => sum + e.grossAmount, 0);
      const totalNet = events.reduce((sum, e) => sum + e.netAmount, 0);
      const currency = events.length > 0 ? events[0].currency : "GBP";

      return {
        sourceId: source.id,
        sourceName: source.displayName,
        platform: source.platform,
        totalGross,
        totalNet,
        currency,
        eventCount: events.length,
      };
    })
  );

  return results.filter((r) => r.eventCount > 0);
}

/**
 * Get total revenue across all sources for a talent
 */
export async function getTotalRevenueForTalent(
  talentId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalGross: number;
  totalNet: number;
  currency: string;
  sourceCount: number;
  eventCount: number;
}> {
  const bySource = await getRevenueBySourceForTalent(talentId, startDate, endDate);

  const totalGross = bySource.reduce((sum, s) => sum + s.totalGross, 0);
  const totalNet = bySource.reduce((sum, s) => sum + s.totalNet, 0);
  const eventCount = bySource.reduce((sum, s) => sum + s.eventCount, 0);

  return {
    totalGross,
    totalNet,
    currency: "GBP", // All stored in GBP by default, but should be normalized per-currency in future
    sourceCount: bySource.length,
    eventCount,
  };
}

/**
 * Get revenue by platform for a talent
 */
export async function getRevenueByPlatformForTalent(
  talentId: string,
  startDate?: Date,
  endDate?: Date
): Promise<
  Array<{
    platform: string;
    totalGross: number;
    totalNet: number;
    currency: string;
    sourceCount: number;
    eventCount: number;
  }>
> {
  const bySource = await getRevenueBySourceForTalent(talentId, startDate, endDate);

  const byPlatform: Record<
    string,
    {
      platform: string;
      totalGross: number;
      totalNet: number;
      currency: string;
      sourceCount: number;
      eventCount: number;
    }
  > = {};

  for (const source of bySource) {
    if (!byPlatform[source.platform]) {
      byPlatform[source.platform] = {
        platform: source.platform,
        totalGross: 0,
        totalNet: 0,
        currency: source.currency,
        sourceCount: 0,
        eventCount: 0,
      };
    }

    byPlatform[source.platform].totalGross += source.totalGross;
    byPlatform[source.platform].totalNet += source.totalNet;
    byPlatform[source.platform].sourceCount += 1;
    byPlatform[source.platform].eventCount += source.eventCount;
  }

  return Object.values(byPlatform);
}

export default {
  REVENUE_PLATFORMS,
  createRevenueSource,
  getRevenueSourcesForTalent,
  getRevenueSource,
  updateRevenueSource,
  deleteRevenueSource,
  recordRevenueEvent,
  getRevenueEventsForSource,
  getRevenueBySourceForTalent,
  getTotalRevenueForTalent,
  getRevenueByPlatformForTalent,
};
