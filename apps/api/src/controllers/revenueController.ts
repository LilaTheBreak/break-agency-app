import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as revenueSourceService from '../services/revenueSourceService.js';
import * as revenueGoalService from '../services/revenueGoalService.js';
import { logError } from '../lib/logger.js';
import { sendSuccess, sendError, sendList } from '../utils/apiResponse.js';

/**
 * Revenue Source Controller
 * 
 * Endpoints for managing revenue sources
 * Only EXCLUSIVE talent can add revenue sources
 */

const CreateRevenueSourceSchema = z.object({
  platform: z.enum(["SHOPIFY", "TIKTOK_SHOP", "LTK", "AMAZON", "CUSTOM"]),
  displayName: z.string().min(1).max(255),
  externalAccountId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * POST /api/revenue-sources
 * Create a new revenue source (admin or talent self-service)
 */
export async function createRevenueSource(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id;
    const talentId = req.body.talentId || userId;
    const role = (req as any).user?.role;

    if (!userId) {
      return sendError(res, "UNAUTHORIZED", "User not authenticated", 401);
    }

    // Permission check: only ADMIN or self (exclusive talent)
    if (role !== "ADMIN" && userId !== talentId) {
      return sendError(res, "FORBIDDEN", "Cannot create revenue source for other users", 403);
    }

    const parsed = CreateRevenueSourceSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, "VALIDATION_ERROR", "Invalid request data", 400, parsed.error.format());
    }

    const source = await revenueSourceService.createRevenueSource(
      talentId,
      parsed.data.platform as any,
      parsed.data.displayName,
      parsed.data.externalAccountId,
      parsed.data.metadata
    );

    return sendSuccess(res, { source }, 201);
  } catch (error) {
    logError("Failed to create revenue source", error, { userId: (req as any).user?.id });
    next(error);
  }
}

/**
 * GET /api/revenue-sources/:talentId
 * Get all revenue sources for a talent
 */
export async function getRevenueSourcesForTalent(req: Request, res: Response, next: NextFunction) {
  try {
    const talentId = req.params.talentId;
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;

    if (!userId) {
      return sendError(res, "UNAUTHORIZED", "User not authenticated", 401);
    }

    // Permission check: admin can view all, users can view own
    if (role !== "ADMIN" && role !== "SUPERADMIN" && userId !== talentId) {
      return sendError(res, "FORBIDDEN", "Cannot view other users' revenue sources", 403);
    }

    const sources = await revenueSourceService.getRevenueSourcesForTalent(talentId);

    return sendList(res, sources);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError("Failed to get revenue sources", error, { userId: (req as any).user?.id, talentId: req.params.talentId });
    return res.status(500).json({ 
      error: "Failed to get revenue sources",
      details: errorMessage
    });
  }
}

/**
 * GET /api/revenue-sources/:sourceId/details
 * Get a specific revenue source with recent events
 */
export async function getRevenueSourceDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const sourceId = req.params.sourceId;
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;

    if (!userId) {
      return sendError(res, "UNAUTHORIZED", "User not authenticated", 401);
    }

    const source = await revenueSourceService.getRevenueSource(sourceId);
    if (!source) {
      return sendError(res, "NOT_FOUND", "Revenue source not found", 404);
    }

    // Permission check
    if (role !== "ADMIN" && userId !== source.talentId) {
      return sendError(res, "FORBIDDEN", "Cannot view other users' revenue sources", 403);
    }

    const recentEvents = await revenueSourceService.getRevenueEventsForSource(sourceId);

    return sendSuccess(res, {
      source,
      recentEvents: recentEvents.slice(0, 50), // Last 50 events
    });
  } catch (error) {
    logError("Failed to get revenue source details", error);
    next(error);
  }
}

/**
 * DELETE /api/revenue-sources/:sourceId
 * Delete a revenue source
 */
export async function deleteRevenueSource(req: Request, res: Response, next: NextFunction) {
  try {
    const sourceId = req.params.sourceId;
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;

    if (!userId) {
      return sendError(res, "UNAUTHORIZED", "User not authenticated", 401);
    }

    const source = await revenueSourceService.getRevenueSource(sourceId);
    if (!source) {
      return sendError(res, "NOT_FOUND", "Revenue source not found", 404);
    }

    // Permission check: admin or talent owner
    if (role !== "ADMIN" && userId !== source.talentId) {
      return sendError(res, "FORBIDDEN", "Cannot delete other users' revenue sources", 403);
    }

    await revenueSourceService.deleteRevenueSource(sourceId);

    return sendSuccess(res, { message: "Revenue source deleted" });
  } catch (error) {
    logError("Failed to delete revenue source", error);
    next(error);
  }
}

// ============================================================================
// REVENUE AGGREGATION ENDPOINTS
// ============================================================================

/**
 * GET /api/revenue/summary/:talentId
 * Get total revenue summary for a talent
 */
export async function getRevenueSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const talentId = req.params.talentId;
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;

    if (!userId) {
      return sendError(res, "UNAUTHORIZED", "User not authenticated", 401);
    }

    // Permission check
    if (role !== "ADMIN" && role !== "SUPERADMIN" && userId !== talentId) {
      return sendError(res, "FORBIDDEN", "Cannot view other users' revenue", 403);
    }

    // Parse optional date range from query
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const summary = await revenueSourceService.getTotalRevenueForTalent(talentId, startDate, endDate);

    return sendSuccess(res, { summary });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError("Failed to get revenue summary", error, { talentId: req.params.talentId });
    return res.status(500).json({ 
      error: "Failed to get revenue summary",
      details: errorMessage
    });
  }
}

/**
 * GET /api/revenue/by-platform/:talentId
 * Get revenue breakdown by platform
 */
export async function getRevenueByPlatform(req: Request, res: Response, next: NextFunction) {
  try {
    const talentId = req.params.talentId;
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;

    if (!userId) {
      return sendError(res, "UNAUTHORIZED", "User not authenticated", 401);
    }

    // Permission check
    if (role !== "ADMIN" && role !== "SUPERADMIN" && userId !== talentId) {
      return sendError(res, "FORBIDDEN", "Cannot view other users' revenue", 403);
    }

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const byPlatform = await revenueSourceService.getRevenueByPlatformForTalent(talentId, startDate, endDate);

    return sendSuccess(res, { byPlatform });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError("Failed to get revenue by platform", error, { talentId: req.params.talentId });
    return res.status(500).json({ 
      error: "Failed to get revenue by platform",
      details: errorMessage
    });
  }
}

/**
 * GET /api/revenue/by-source/:talentId
 * Get revenue breakdown by individual source
 */
export async function getRevenueBySource(req: Request, res: Response, next: NextFunction) {
  try {
    const talentId = req.params.talentId;
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;

    if (!userId) {
      return sendError(res, "UNAUTHORIZED", "User not authenticated", 401);
    }

    // Permission check
    if (role !== "ADMIN" && userId !== talentId) {
      return sendError(res, "FORBIDDEN", "Cannot view other users' revenue", 403);
    }

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const bySource = await revenueSourceService.getRevenueBySourceForTalent(talentId, startDate, endDate);

    return sendSuccess(res, { bySource });
  } catch (error) {
    logError("Failed to get revenue by source", error);
    next(error);
  }
}

// ============================================================================
// REVENUE GOALS ENDPOINTS
// ============================================================================

const CreateRevenueGoalSchema = z.object({
  goalType: z.enum(["MONTHLY_TOTAL", "QUARTERLY_TOTAL", "ANNUAL_TOTAL", "PLATFORM_SPECIFIC"]),
  platform: z.string().optional(),
  targetAmount: z.number().positive(),
  currency: z.string().optional().default("GBP"),
  startDate: z.string().datetime().transform((s) => new Date(s)).optional(),
  endDate: z.string().datetime().transform((s) => new Date(s)).optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/revenue-goals
 * Create a revenue goal
 */
export async function createRevenueGoal(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id;
    const talentId = req.body.talentId || userId;
    const role = (req as any).user?.role;

    if (!userId) {
      return sendError(res, "UNAUTHORIZED", "User not authenticated", 401);
    }

    // Permission check
    if (role !== "ADMIN" && userId !== talentId) {
      return sendError(res, "FORBIDDEN", "Cannot create goals for other users", 403);
    }

    const parsed = CreateRevenueGoalSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, "VALIDATION_ERROR", "Invalid request data", 400, parsed.error.format());
    }

    const goal = await revenueGoalService.createRevenueGoal({
      talentId,
      ...parsed.data,
    });

    return sendSuccess(res, { goal }, 201);
  } catch (error) {
    logError("Failed to create revenue goal", error);
    next(error);
  }
}

/**
 * GET /api/revenue-goals/:talentId
 * Get all goals for a talent with progress
 */
export async function getRevenueGoals(req: Request, res: Response, next: NextFunction) {
  try {
    const talentId = req.params.talentId;
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;

    if (!userId) {
      return sendError(res, "UNAUTHORIZED", "User not authenticated", 401);
    }

    // Permission check
    if (role !== "ADMIN" && role !== "SUPERADMIN" && userId !== talentId) {
      return sendError(res, "FORBIDDEN", "Cannot view other users' goals", 403);
    }

    const progress = await revenueGoalService.getAllGoalProgress(talentId);

    return sendSuccess(res, { goals: progress });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError("Failed to get revenue goals", error, { talentId: req.params.talentId });
    return res.status(500).json({ 
      error: "Failed to get revenue goals",
      details: errorMessage
    });
  }
}

/**
 * DELETE /api/revenue-goals/:goalId
 * Delete a revenue goal
 */
export async function deleteRevenueGoal(req: Request, res: Response, next: NextFunction) {
  try {
    const goalId = req.params.goalId;
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;

    if (!userId) {
      return sendError(res, "UNAUTHORIZED", "User not authenticated", 401);
    }

    const goal = await revenueGoalService.getRevenueGoal(goalId);
    if (!goal) {
      return sendError(res, "NOT_FOUND", "Goal not found", 404);
    }

    // Permission check
    if (role !== "ADMIN" && userId !== goal.talentId) {
      return sendError(res, "FORBIDDEN", "Cannot delete other users' goals", 403);
    }

    await revenueGoalService.deleteRevenueGoal(goalId);

    return sendSuccess(res, { message: "Goal deleted" });
  } catch (error) {
    logError("Failed to delete revenue goal", error);
    next(error);
  }
}

export default {
  createRevenueSource,
  getRevenueSourcesForTalent,
  getRevenueSourceDetails,
  deleteRevenueSource,
  getRevenueSummary,
  getRevenueByPlatform,
  getRevenueBySource,
  createRevenueGoal,
  getRevenueGoals,
  deleteRevenueGoal,
};
