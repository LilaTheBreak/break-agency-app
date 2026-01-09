import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prismaClient.js";
import { isSuperAdmin, isCreator } from "../lib/roleHelpers.js";

/**
 * Middleware to ensure user is authenticated and has creator role
 * CRITICAL: SUPERADMIN bypasses this check
 */
export async function requireCreator(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // CRITICAL: Superadmin bypasses ALL permission checks
    if (isSuperAdmin(user)) {
      return next();
    }

    // Check if user has creator role or is talent
    if (!isCreator(user)) {
      return res.status(403).json({ 
        error: "Access denied. Creator account required." 
      });
    }

    next();
  } catch (error) {
    console.error("Creator auth middleware error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}

/**
 * Middleware to load and attach creator profile to request
 * Requires requireCreator to run first
 */
export async function attachCreatorProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Load creator's Talent profile
    const talent = await prisma.talent.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        categories: true,
        stage: true,
      }
    });

    if (!talent) {
      return res.status(404).json({ 
        error: "Creator profile not found. Please complete onboarding." 
      });
    }

    // Attach to request
    (req as any).creator = talent;

    next();
  } catch (error) {
    console.error("Attach creator profile error:", error);
    return res.status(500).json({ error: "Failed to load creator profile" });
  }
}

/**
 * Middleware to ensure creator can only access their own data
 * Use on routes with :creatorId param
 * CRITICAL: SUPERADMIN bypasses this check
 */
export async function requireOwnCreatorData(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const creator = (req as any).creator;
    const requestedCreatorId = req.params.creatorId || req.query.creatorId;

    // CRITICAL: Superadmin can access all creator data
    if (isSuperAdmin(user)) {
      return next();
    }

    if (!creator) {
      return res.status(401).json({ error: "Creator profile required" });
    }

    // If route specifies a creator ID, ensure it matches
    if (requestedCreatorId && requestedCreatorId !== creator.id) {
      return res.status(403).json({ 
        error: "Access denied. You can only access your own data." 
      });
    }

    next();
  } catch (error) {
    console.error("Own creator data check error:", error);
    return res.status(500).json({ error: "Authorization failed" });
  }
}

/**
 * Utility to get safe revenue summary for creator
 * Rounds values and hides sensitive financial data
 */
export function formatSafeRevenue(amount: number): string {
  if (amount === 0) return "£0";
  
  // Round to nearest thousand for amounts over £10k
  if (amount >= 10000) {
    const rounded = Math.round(amount / 1000);
    return `£${rounded}K`;
  }
  
  // Round to nearest hundred for smaller amounts
  const rounded = Math.round(amount / 100) * 100;
  return `£${(rounded / 1000).toFixed(1)}K`;
}

/**
 * Utility to filter deal data for creator safety
 * Removes negotiation details, agent notes, sensitive financial info
 */
export function sanitizeDealForCreator(deal: any) {
  return {
    id: deal.id,
    brandName: deal.brandName || deal.Brand?.name,
    stage: deal.stage,
    value: deal.value ? formatSafeRevenue(deal.value) : null,
    currency: deal.currency,
    expectedClose: deal.expectedClose,
    campaignLiveAt: deal.campaignLiveAt,
    createdAt: deal.createdAt,
    updatedAt: deal.updatedAt,
    // Explicitly exclude sensitive fields
    // notes, aiSummary (may contain agent notes), negotiation data
  };
}

/**
 * Utility to filter task data for creator safety
 * Only returns creative, attendance, review, or approval tasks
 * Excludes internal admin tasks
 */
export function sanitizeTaskForCreator(task: any) {
  const allowedTaskTypes = ["creative", "attendance", "review", "approval"];
  
  if (!allowedTaskTypes.includes(task.taskType)) {
    return null; // Filter out non-creator tasks
  }

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    taskType: task.taskType,
    dueAt: task.dueAt,
    completedAt: task.completedAt,
    priority: task.priority,
    status: task.status,
    linkedDealId: task.linkedDealId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    // Exclude: createdBy, internal notes
  };
}

/**
 * Utility to filter event data for creator safety
 */
export function sanitizeEventForCreator(event: any) {
  return {
    id: event.id,
    eventName: event.eventName,
    eventType: event.eventType,
    description: event.description,
    location: event.location,
    startAt: event.startAt,
    endAt: event.endAt,
    status: event.status,
    source: event.source,
    declineReason: event.declineReason,
    createdAt: event.createdAt,
    // Exclude: sourceUserId, internal agent notes
  };
}

/**
 * Safe defaults for API responses
 * Returns empty but valid structures instead of errors
 */
export const SAFE_DEFAULTS = {
  projects: [],
  opportunities: [],
  tasks: [],
  events: [],
  calendar: [],
  insights: [],
  revenue: {
    totalEarned: "£0",
    potentialRevenue: "£0",
    trend: "flat",
    rawTotal: 0,
    rawPotential: 0
  },
  goals: [],
  socials: [],
  aiHistory: []
};
