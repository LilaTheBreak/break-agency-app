import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../utils/prismaClient.js";
import { z } from "zod";
import { requireCreator, attachCreatorProfile } from "../middleware/creatorAuth.js";
import { createGoalVersion, computeCreatorIntentProfile } from "../utils/goalUtils.js";
import {
  getCreatorAnalyticsSnapshot,
  getCreatorContentInsights,
  getCreatorAudienceInsights,
} from "../services/creatorAnalyticsAdapter.js";

const router = Router();

router.use("/api/creator", requireAuth);

// Note: Creator score endpoint disabled - creatorScore model not in schema
// /**
//  * GET /api/creator/:id/score
//  * Fetches the latest score for a specific creator.
//  */
// router.get("/api/creator/:id/score", async (req: Request, res: Response) => {
//   try {
//     const score = await prisma.creatorScore.findFirst({
//       where: { userId: req.params.id },
//       orderBy: { createdAt: "desc" },
//     });
//
//     if (!score) {
//       return res.status(404).json({ error: "No score found for this creator." });
//     }
//
//     res.json({ score });
//   } catch (error) {
//     console.error("Failed to fetch creator score:", error);
//     res.status(500).json({ error: "Could not load creator score." });
//   }
// });

/**
 * POST /api/creator/goals — Batch goal creation for onboarding flow
 * 
 * Accepts:
 * - Array of goal objects (can be empty)
 * - Partial data allowed
 * - Automatically archives old goals
 * 
 * Behaviour:
 * - Creates version snapshots for each goal
 * - Never blocks onboarding (graceful fallback)
 * - Returns categorized summary
 */
router.post("/api/creator/goals", requireCreator, attachCreatorProfile, async (req: Request, res: Response) => {
  try {
    const creator = (req as any).creator;
    const { goals } = req.body;

    // Allow empty submissions (creator skips goal setting)
    if (!goals || !Array.isArray(goals) || goals.length === 0) {
      return res.json({
        success: true,
        created: 0,
        archived: 0,
        message: "No goals set — you can add them anytime from your overview page",
      });
    }

    // Step 1: Archive existing active goals (fresh slate for onboarding)
    const existingGoals = await prisma.creatorGoal.findMany({
      where: { creatorId: creator.id, active: true },
    });

    const archived = await Promise.allSettled(
      existingGoals.map(async (goal) => {
        await prisma.creatorGoal.update({
          where: { id: goal.id },
          data: { active: false },
        });
        await createGoalVersion(
          goal.id,
          goal as any,
          "archived",
          "system" // Automated during onboarding
        );
      })
    );

    // Step 2: Create new goals with validation
    const created = await Promise.allSettled(
      goals.map(async (goalData: any) => {
        // Validate required fields (lenient for onboarding)
        if (!goalData.title || typeof goalData.title !== "string") {
          return null; // Skip invalid goals silently
        }

        const goal = await prisma.creatorGoal.create({
          data: {
            id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            updatedAt: new Date(),
            creatorId: creator.id,
            goalCategory: goalData.goalCategory || "growth",
            goalType: goalData.goalType || "other",
            title: goalData.title.trim(),
            targetValue: goalData.targetValue || null,
            targetUnit: goalData.targetUnit || null,
            timeframe: goalData.timeframe || null,
            progress: 0,
            active: true,
          },
        });

        // Create version snapshot
        await createGoalVersion(goal.id, goal as any, "created", "creator");

        return goal;
      })
    );

    // Count successful operations
    const createdGoals = created.filter((r) => r.status === "fulfilled" && r.value).map((r: any) => r.value);
    const archivedCount = archived.filter((r) => r.status === "fulfilled").length;

    // Return categorized summary for UI feedback
    const categorized: Record<string, number> = {};
    createdGoals.forEach((goal: any) => {
      const cat = goal.goalCategory;
      categorized[cat] = (categorized[cat] || 0) + 1;
    });

    res.json({
      success: true,
      created: createdGoals.length,
      archived: archivedCount,
      categories: categorized,
      goals: createdGoals, // Return for UI confirmation
    });
  } catch (error) {
    console.error("Batch goal creation error:", error);
    // NEVER block onboarding — return success with warning
    res.json({
      success: true,
      created: 0,
      archived: 0,
      warning: "Goals could not be saved, but you can add them later",
    });
  }
});

/**
 * GET /api/creator/intent-profile — Virtual computed profile from goals
 * 
 * Returns:
 * - Aggregated intent summary
 * - Category distribution
 * - AI-ready context string
 * - Sensitivity flags
 * 
 * Used by:
 * - AI prompt construction
 * - Agent dashboards
 * - Recommendation engines
 */
router.get("/api/creator/intent-profile", requireCreator, attachCreatorProfile, async (req: Request, res: Response) => {
  try {
    const creator = (req as any).creator;
    const goals = await prisma.creatorGoal.findMany({
      where: { creatorId: creator.id },
      orderBy: { createdAt: "desc" },
    });

    const profile = computeCreatorIntentProfile(goals);

    res.json(profile);
  } catch (error) {
    console.error("Intent profile error:", error);
    res.json({
      activeGoals: 0,
      categories: [],
      types: [],
      primaryFocus: "general",
      sensitiveGoals: 0,
      hasSensitiveGoals: false,
      aiContext: "This creator has not set specific goals yet.",
      lastUpdated: new Date(),
    });
  }
});

/**
 * GET /api/creator/analytics — Creator-safe analytics snapshot
 * 
 * Returns:
 * - Performance trend (qualitative labels, not raw numbers)
 * - Engagement health assessment
 * - Platform-specific highlights and suggestions
 * - Top content themes with actionable next steps
 * - Audience signals (timing, preferences)
 * - Growth opportunities (emerging formats, untapped topics)
 * - AI-generated insights from CreatorInsight records
 * 
 * Design principles:
 * - No raw metrics (rounded/interpreted only)
 * - No comparative data (creator vs others)
 * - No brand-specific performance exposure
 * - Coaching tone, not judgment
 * - Graceful fallback (never fails the page)
 */
router.get("/api/creator/analytics", requireCreator, attachCreatorProfile, async (req: Request, res: Response) => {
  try {
    const creator = (req as any).creator;
    
    // Parse optional date range (defaults to last 30 days)
    const days = parseInt(req.query.days as string) || 30;
    const dateRange = {
      start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      end: new Date(),
    };

    const snapshot = await getCreatorAnalyticsSnapshot(creator.id, dateRange);

    res.json(snapshot);
  } catch (error) {
    console.error("Creator analytics error:", error);
    
    // Parse days again for fallback (outside try block scope)
    const fallbackDays = parseInt((req.query.days as string) || "30") || 30;
    
    // Never fail — return safe defaults
    res.json({
      performanceTrend: {
        label: "Building",
        tone: "neutral",
        context: "Connect your social accounts to see performance insights",
      },
      engagementHealth: {
        label: "Not enough data yet",
        tone: "neutral",
        tip: "Link your Instagram, TikTok, or YouTube to get started",
      },
      platformHighlights: [],
      topContentThemes: [],
      audienceSignals: [],
      growthOpportunities: [],
      aiInsights: [],
      metadata: {
        lastUpdatedAt: new Date(),
        dataSources: [],
        coverageDays: fallbackDays,
      },
    });
  }
});

/**
 * GET /api/creator/analytics/content — Top-performing content insights
 * 
 * Returns:
 * - Platform + title
 * - Why it worked
 * - What to replicate
 * - Posted date
 * 
 * Sorted by engagement (no raw numbers shown)
 * Limit: 10 posts (configurable via query param)
 */
router.get("/api/creator/analytics/content", requireCreator, attachCreatorProfile, async (req: Request, res: Response) => {
  try {
    const creator = (req as any).creator;
    const limit = parseInt(req.query.limit as string) || 10;

    const insights = await getCreatorContentInsights(creator.id, limit);

    res.json({ insights });
  } catch (error) {
    console.error("Creator content insights error:", error);
    res.json({ insights: [] }); // Fail gracefully
  }
});

/**
 * GET /api/creator/analytics/audience — Aggregated audience insights
 * 
 * Returns:
 * - Primary demographic (age/gender, aggregated)
 * - Top locations
 * - Peak activity hours
 * - Content preferences
 * 
 * Aggregated across all connected platforms
 * No individual platform breakdowns (creator-safe)
 */
router.get("/api/creator/analytics/audience", requireCreator, attachCreatorProfile, async (req: Request, res: Response) => {
  try {
    const creator = (req as any).creator;

    const audienceInsights = await getCreatorAudienceInsights(creator.id);

    res.json(audienceInsights);
  } catch (error) {
    console.error("Creator audience insights error:", error);
    res.json({
      primaryDemographic: "Not available",
      topLocations: [],
      peakActivityHours: "Not available",
      contentPreferences: [],
    });
  }
});

export default router;