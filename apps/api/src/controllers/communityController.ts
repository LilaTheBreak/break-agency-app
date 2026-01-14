/**
 * Community Management Controller
 * 
 * API endpoints for community connections and metrics
 */

import { Request, Response } from "express";
import { z } from "zod";
import * as communityService from '../services/communityService.js';

// Validation schemas
const createConnectionSchema = z.object({
  platform: z.enum(["instagram", "tiktok", "twitter", "youtube", "linkedin", "discord", "threads"]),
  accountHandle: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const updateMetricSchema = z.object({
  metricType: z.enum([
    "engagement_rate",
    "comments_vs_likes",
    "saves_shares",
    "repeat_commenters",
    "response_velocity",
  ]),
  period: z.enum(["day", "week", "month", "lifetime"]).default("week"),
  value: z.number().min(0),
  data: z.record(z.string(), z.any()).optional(),
});

/**
 * Connect social account
 */
export async function connectAccountHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { talentId } = req.params;

    // TODO: Add permission check - user can only connect their own talent accounts
    // For now, basic auth check

    const validation = createConnectionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.issues });
      return;
    }

    const { platform, accountHandle, metadata } = validation.data;

    const connection = await communityService.upsertCommunityConnection({
      talentId,
      platform,
      accountHandle,
      metadata,
    });

    res.status(201).json({
      message: "Account connected",
      connection,
    });
  } catch (error) {
    console.error("[Connect Account]", error);
    res.status(500).json({ error: "Failed to connect account" });
  }
}

/**
 * Get talent's community connections
 */
export async function getConnectionsHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { talentId } = req.params;

    const connections = await communityService.getTalentConnections(talentId);
    const hasConnected = await communityService.hasConnectedAccounts(talentId);

    res.json({
      connections,
      hasConnectedAccounts: hasConnected,
    });
  } catch (error) {
    console.error("[Get Connections]", error);
    res.status(500).json({ error: "Failed to get connections" });
  }
}

/**
 * Get community snapshot
 */
export async function getCommunitySnapshotHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { talentId } = req.params;

    const snapshot = await communityService.getCommunitySnapshot(talentId);

    res.json({
      snapshot,
    });
  } catch (error) {
    console.error("[Get Community Snapshot]", error);
    res.status(500).json({ error: "Failed to get community snapshot" });
  }
}

/**
 * Update engagement metric
 */
export async function updateMetricHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { connectionId } = req.params;

    const validation = updateMetricSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.issues });
      return;
    }

    const { metricType, period, value, data } = validation.data;

    // Get connection to extract talentId and platform
    const connection = await communityService.getConnection(connectionId);
    if (!connection) {
      res.status(404).json({ error: "Connection not found" });
      return;
    }

    const metric = await communityService.upsertMetric(
      connectionId,
      connection.talentId,
      connection.platform,
      metricType,
      period,
      value,
      data
    );

    res.json({
      message: "Metric updated",
      metric,
    });
  } catch (error) {
    console.error("[Update Metric]", error);
    res.status(500).json({ error: "Failed to update metric" });
  }
}

/**
 * Disconnect account
 */
export async function disconnectAccountHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { connectionId } = req.params;

    await communityService.deleteConnection(connectionId);

    res.json({
      message: "Account disconnected",
    });
  } catch (error) {
    console.error("[Disconnect Account]", error);
    res.status(500).json({ error: "Failed to disconnect account" });
  }
}

/**
 * Mark connection as connected (for admin/integration use)
 */
export async function markConnectedHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { connectionId } = req.params;
    const { followers, metadata } = req.body;

    const connection = await communityService.markConnectionConnected(
      connectionId,
      followers || 0,
      metadata
    );

    res.json({
      message: "Connection marked as connected",
      connection,
    });
  } catch (error) {
    console.error("[Mark Connected]", error);
    res.status(500).json({ error: "Failed to mark connection" });
  }
}
