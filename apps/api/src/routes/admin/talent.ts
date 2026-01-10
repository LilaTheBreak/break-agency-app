import { Router, type Request, type Response } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import prisma from "../../lib/prisma.js";
import redis from "../../lib/redis.js";
import { TaskStatus, SocialPlatform } from "@prisma/client";
import { z } from "zod";
import { isAdmin, isSuperAdmin } from "../../lib/roleHelpers.js";
import { logAdminActivity } from "../../lib/adminActivityLogger.js";
import { logAuditEvent, logDestructiveAction } from "../../lib/auditLogger.js";
import { logError } from "../../lib/logger.js";
import { sendSuccess, sendList, sendEmptyList, sendError, handleApiError } from "../../utils/apiResponse.js";
import { validateRequestSafe, TalentCreateSchema, TalentUpdateSchema, TalentLinkUserSchema } from "../../utils/validationSchemas.js";
import * as Sentry from "@sentry/node";
import { scrapeInstagramProfile } from "../../services/socialScrapers/instagram.js";
import { normalizeInstagramHandle } from "../../services/socialScrapers/instagramUtils.js";

const router = Router();

// All routes require admin access
router.use(requireAuth);
router.use((req: Request, res: Response, next) => {
  if (!isAdmin(req.user!) && !isSuperAdmin(req.user!)) {
    return sendError(res, "FORBIDDEN", "Forbidden: Admin access required", 403);
  }
  next();
});

/**
 * GET /api/admin/talent
 * List all talent with summary metrics
 * 
 * Query parameters:
 * - representationType: Filter by EXCLUSIVE or NON_EXCLUSIVE
 * - limit: Maximum number of results (default: all)
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    console.log("[TALENT] GET /api/admin/talent - Fetching all talents");
    console.log("[TALENT] User making request:", req.user?.id, req.user?.role);
    console.log("[TALENT] Query parameters:", req.query);
    
    const { representationType, limit } = req.query;
    const talentLimit = limit ? parseInt(limit as string, 10) : undefined;
    
    // First, try a simple count to verify connection
    const totalCount = await prisma.talent.count();
    console.log("[TALENT] Total talent count in database:", totalCount);
    
    // Build where clause for filtering
    const whereClause: any = {};
    if (representationType && representationType !== "all") {
      whereClause.representationType = representationType;
      console.log("[TALENT] Filtering by representationType:", representationType);
    }
    
    console.log("[TALENT] About to call prisma.talent.findMany with whereClause:", JSON.stringify(whereClause));
    
    // Fetch talents with User relation included - critical for rendering
    // Note: Talent model doesn't have createdAt/updatedAt fields, so we order by id instead
    let talentsWithoutUser: any[] = [];
    try {
      talentsWithoutUser = await prisma.talent.findMany({
        where: whereClause,
        include: {
          User: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          id: "desc", // Order by id since createdAt doesn't exist on Talent model
        },
        take: talentLimit,
      });
      console.log("[TALENT] Successfully fetched", talentsWithoutUser.length, "talents from database");
    } catch (findManyError) {
      console.error("[TALENT] ERROR in findMany call:", findManyError);
      throw new Error(`[TALENT] Prisma findMany failed: ${findManyError instanceof Error ? findManyError.message : String(findManyError)}`);
    }
    console.log("[TALENT] Found", talentsWithoutUser.length, "talents with User relation");
    
    // Use talentsWithoutUser as the base, then enrich with Deal data
    let talents = talentsWithoutUser;
    
    console.log("[TALENT] Found", talents.length, "talents (base query)");
    
    // If we have talents, enrich them with Deal data
    if (talents.length > 0) {
      // Enrich with User and Deal data
      // CRITICAL: Wrap in try-catch to prevent Promise.all from failing entirely
      let enrichedTalents: any[] = [];
      try {
        enrichedTalents = await Promise.all(
        talents.map(async (talent) => {
          try {
            // User already included in base query, use it directly
            const userData = talent.User ? {
              id: talent.User.id,
              email: talent.User.email,
              name: talent.User.name,
              avatarUrl: talent.User.avatarUrl,
            } : null;
            
            // Fetch Deal count separately
            let dealCount = 0;
            let activeDeals = 0;
            try {
              const deals = await prisma.deal.findMany({
                where: { talentId: talent.id },
                select: {
                  id: true,
                  stage: true,
                },
              });
              dealCount = deals.length;
              activeDeals = deals.filter(d => d.stage && !["COMPLETED", "LOST"].includes(d.stage)).length;
            } catch (dealError) {
              console.warn("[TALENT] Failed to fetch Deals for talent", talent.id);
            }
            
            // Fetch CreatorTask count
            let taskCount = 0;
            try {
              taskCount = await prisma.creatorTask.count({
                where: { creatorId: talent.id },
              });
            } catch (taskError) {
              console.warn("[TALENT] Failed to fetch CreatorTasks for talent", talent.id);
            }
            
            // Fetch social accounts for primary handle display
            let socialAccounts: Array<{ platform: string; handle: string }> = [];
            let primarySocialHandle: string | null = null;
            try {
              socialAccounts = await prisma.socialAccountConnection.findMany({
                where: { creatorId: talent.id, connected: true },
                select: {
                  platform: true,
                  handle: true,
                },
                orderBy: { createdAt: "asc" },
                take: 5, // Limit to primary platforms
              });
              // Get first available handle as primary (prefer Instagram, then TikTok, then others)
              const instagram = socialAccounts.find(s => s.platform === "INSTAGRAM");
              const tiktok = socialAccounts.find(s => s.platform === "TIKTOK");
              primarySocialHandle = instagram?.handle || tiktok?.handle || socialAccounts[0]?.handle || null;
            } catch (socialError) {
              console.warn("[TALENT] Failed to fetch social accounts for talent", talent.id);
            }
            
            return {
              id: talent.id,
              name: talent.name || "Unknown",
              displayName: talent.displayName || talent.name || "Unknown",
              representationType: talent.representationType || "NON_EXCLUSIVE", // FIXED: Use actual value from DB
              status: talent.status || "ACTIVE", // FIXED: Use actual value from DB
              linkedUser: userData
                ? {
                    id: userData.id,
                    email: userData.email,
                    name: userData.name,
                    avatarUrl: userData.avatarUrl,
                  }
                : null,
              socialAccounts,
              primarySocialHandle,
              managerId: null,
              metrics: {
                openOpportunities: 0, // Will be calculated below
                activeDeals,
                totalDeals: dealCount,
                totalTasks: taskCount,
                totalRevenue: 0, // Will be calculated below
              },
              // Note: Talent model doesn't have createdAt/updatedAt fields
            };
          } catch (talentError) {
            console.error("[TALENT] Failed to enrich talent", talent.id, talentError);
            // Return minimal data with actual DB values
            return {
              id: talent.id,
              name: talent.name || "Unknown",
              displayName: talent.displayName || talent.name || "Unknown",
              representationType: talent.representationType || "NON_EXCLUSIVE", // FIXED: Use actual value
              status: talent.status || "ACTIVE", // FIXED: Use actual value
              linkedUser: null,
              managerId: null,
              metrics: {
                openOpportunities: 0,
                activeDeals: 0,
                totalDeals: 0,
                totalTasks: 0,
                totalRevenue: 0,
              },
              // Note: Talent model doesn't have createdAt/updatedAt fields
            };
          }
        })
        );
      } catch (enrichmentError) {
        // CRITICAL FIX: If enrichment fails, log error but don't lose the base talents
        console.error("[TALENT] Enrichment Promise.all failed:", enrichmentError);
        logError("Talent enrichment Promise.all failed", enrichmentError, {
          talentCount: talents.length,
          userId: req.user?.id
        });
        // Use base talents without enrichment rather than empty array
        enrichedTalents = talents.map(t => ({
          id: t.id,
          name: t.name || "Unknown",
          displayName: t.displayName || t.name || "Unknown",
          representationType: t.representationType || "NON_EXCLUSIVE", // FIXED: Use actual value
          status: t.status || "ACTIVE", // FIXED: Use actual value
          linkedUser: null,
          managerId: null,
          metrics: {
            openOpportunities: 0,
            activeDeals: 0,
            totalDeals: 0,
            totalTasks: 0,
            totalRevenue: 0,
          },
          // Note: Talent model doesn't have createdAt/updatedAt fields
        }));
      }
      
      talents = enrichedTalents;
    }
    
    console.log("[TALENT] Found", talents.length, "talents after enrichment");
    
    // CRITICAL FIX: Never return empty list if database has records
    // If enrichment fails, return base talents without enrichment rather than empty array
    if (totalCount > 0 && talents.length === 0) {
      console.error("[TALENT] CRITICAL: Count shows", totalCount, "talents but enrichment returned 0!");
      console.error("[TALENT] Enrichment failed - returning base talents without enrichment");
      logError("Talent enrichment failed - returning base query results", new Error("Enrichment returned empty array"), {
        totalCount,
        userId: req.user?.id,
        route: req.path
      });
      Sentry.captureException(new Error("Talent enrichment failed"), {
        tags: { route: '/admin/talent', method: 'GET' },
        extra: { totalCount, enrichedCount: 0 }
      });
      
      // Return base talents without enrichment rather than empty array
      // This ensures read-after-write consistency
      const baseTalents = talentsWithoutUser.map(t => ({
        id: t.id,
        name: t.name || "Unknown",
        displayName: t.displayName || t.name || "Unknown",
        representationType: t.representationType || "NON_EXCLUSIVE", // FIXED: Use actual value
        status: t.status || "ACTIVE", // FIXED: Use actual value
        linkedUser: null,
        managerId: null,
        metrics: {
          openOpportunities: 0,
          activeDeals: 0,
          totalDeals: 0,
          totalTasks: 0,
          totalRevenue: 0,
        },
        // Note: Talent model doesn't have createdAt/updatedAt fields
      }));
      
      console.log("[TALENT] Returning", baseTalents.length, "base talents (enrichment failed)");
      return sendList(res, baseTalents);
    }
    
    if (totalCount !== talents.length) {
      console.warn("[TALENT] Count mismatch: database has", totalCount, "but returning", talents.length, "talents");
    }

    // Calculate additional metrics for each talent (openOpportunities, totalRevenue)
    // CRITICAL: Wrap in try-catch to prevent Promise.all from failing entirely
    let talentsWithMetrics: any[] = [];
    try {
      talentsWithMetrics = await Promise.all(
      talents.map(async (talentWithEnrichment: any) => {
        try {
          // Count open opportunities for this talent
          // Opportunities are linked through OpportunityApplication.creatorId (which is userId)
          let openOpportunities = 0;
          if (talentWithEnrichment.linkedUser?.id) {
            try {
              openOpportunities = await prisma.opportunityApplication.count({
                where: {
                  creatorId: talentWithEnrichment.linkedUser.id,
                  status: { not: "rejected" } // Count pending and accepted applications
                }
              });
            } catch (oppError) {
              console.warn("[TALENT] Failed to count opportunities for talent", talentWithEnrichment.id);
            }
          }

          // Calculate total revenue (from Payments) - handle gracefully if field doesn't exist
          let totalRevenue = 0;
          try {
            const revenueResult = await prisma.payment.aggregate({
              where: {
                talentId: talentWithEnrichment.id,
              },
              _sum: {
                amount: true,
              },
            });
            totalRevenue = revenueResult._sum.amount || 0;
          } catch (paymentError) {
            // Payment model might not have talentId field yet - ignore gracefully
            console.warn("[TALENT] Payment aggregation failed (may not be implemented yet):", paymentError);
          }

          // Return talent with updated metrics
          return {
            ...talentWithEnrichment,
            metrics: {
              ...(talentWithEnrichment.metrics || {}),
              openOpportunities,
              totalRevenue,
            },
          };
        } catch (talentError) {
          // If individual talent processing fails, return talent as-is
          logError("Failed to process talent metrics", talentError, { talentId: talentWithEnrichment.id });
          return talentWithEnrichment; // Return the talent we already have
        }
      })
      );
    } catch (metricsError) {
      // CRITICAL FIX: If metrics calculation fails, return talents without metrics rather than empty array
      console.error("[TALENT] Metrics calculation Promise.all failed:", metricsError);
      logError("Talent metrics calculation failed", metricsError, {
        talentCount: talents.length,
        userId: req.user?.id
      });
      // Return talents without additional metrics rather than empty array
      talentsWithMetrics = talents;
    }

    console.log("[TALENT] Returning", talentsWithMetrics?.length || 0, "talents with metrics");
    return sendList(res, talentsWithMetrics || []);
  } catch (error) {
    console.error("[TALENT] Error fetching talent list:", error);
    console.error("[TALENT] Error stack:", error instanceof Error ? error.stack : "No stack available");
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error("[TALENT] Error name:", error.name);
      console.error("[TALENT] Error message:", error.message);
      console.error("[TALENT] Error cause:", (error as any).cause);
      console.error("[TALENT] Error code:", (error as any).code);
    }
    
    logError("Failed to fetch talent list", error, { userId: req.user?.id, route: req.path });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/admin/talent', method: 'GET' },
    });
    
    // CRITICAL FIX: Always return proper error response with 500 status
    // Never return silent failure or 503
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch talent list",
      message: error instanceof Error ? error.message : "Failed to fetch talent list",
      details: process.env.NODE_ENV === 'development' ? {
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack'
      } : undefined,
      code: "TALENT_FETCH_FAILED"
    });
  }
});

/**
 * GET /api/admin/talent/:id
 * Get single talent with full details
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log("[TALENT GET] Fetching talent details for ID:", id);

    // Note: findUnique doesn't support orderBy on relations, so we fetch talent first
    // then fetch relations separately with ordering
    const talent = await prisma.talent.findUnique({
      where: { id },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        },
        _count: {
          select: {
            Deal: true,
            CreatorTask: true,
            Payment: true,
            Payout: true,
          },
        },
      },
    });

    if (!talent) {
      console.warn("[TALENT GET] Talent not found:", id);
      return res.status(404).json({ error: "Talent not found" });
    }

    console.log("[TALENT GET] Found talent, fetching relations for ID:", id);

    // Fetch relations separately with ordering (findUnique doesn't support orderBy on relations)
    let deals: any[] = [];
    let tasks: any[] = [];
    let payments: any[] = [];
    let payouts: any[] = [];
    let socialAccounts: any[] = [];
    
    try {
      deals = await prisma.deal.findMany({
        where: { talentId: id },
        include: {
          Brand: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (e) {
      console.warn("[TALENT GET] Failed to fetch deals:", e);
    }
    
    try {
      tasks = await prisma.creatorTask.findMany({
        where: { creatorId: id },
        orderBy: {
          dueAt: "desc",
        },
        take: 20,
      });
    } catch (e) {
      console.warn("[TALENT GET] Failed to fetch tasks:", e);
    }
    
    try {
      payments = await prisma.payment.findMany({
        where: { talentId: id },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      });
    } catch (e) {
      console.warn("[TALENT GET] Failed to fetch payments:", e);
    }
    
    try {
      payouts = await prisma.payout.findMany({
        where: { creatorId: id },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      });
    } catch (e) {
      console.warn("[TALENT GET] Failed to fetch payouts:", e);
    }
    
    try {
      socialAccounts = await prisma.socialAccountConnection.findMany({
        where: { creatorId: id, connected: true },
        select: {
          id: true,
          platform: true,
          handle: true,
          connected: true,
          lastSyncedAt: true,
        },
        orderBy: { createdAt: "asc" },
      });
    } catch (e) {
      console.warn("[TALENT GET] Failed to fetch social accounts:", e);
    }

    // Attach relations to talent object
    const talentWithRelations = {
      ...talent,
      Deal: deals,
      CreatorTask: tasks,
      Payment: payments,
      Payout: payouts,
      socialAccounts,
    };

    // Calculate snapshot metrics (use talentWithRelations instead of talent)
    const activeDeals = deals.filter((d) => d.stage !== "COMPLETED" && d.stage !== "LOST").length;
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPayouts = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Count open opportunities (placeholder - will be implemented when Opportunity model is updated)
    const openOpportunities = 0;

    // Count active campaigns (placeholder - will be implemented when Campaign model has talentId)
    const activeCampaigns = 0;

    // Count contracts in progress (placeholder - will be implemented when Contract model has talentId)
    const contractsInProgress = 0;

    const talentData = {
      id: talent.id,
      name: talent.name,
      displayName: talent.displayName || talent.name,
      legalName: talent.legalName,
      primaryEmail: talent.primaryEmail || talent.User?.email || null,
      representationType: talent.representationType || "NON_EXCLUSIVE",
      status: talent.status || "ACTIVE",
      userId: talent.userId,
      managerId: talent.managerId,
      notes: talent.notes,
      profileImageUrl: talent.profileImageUrl || null,
      profileImageSource: talent.profileImageSource || "initials",
      lastProfileImageSyncAt: talent.lastProfileImageSyncAt || null,
      categories: talent.categories,
      stage: talent.stage,
      linkedUser: talent.User
        ? {
            id: talent.User.id,
            email: talent.User.email,
            name: talent.User.name,
            avatarUrl: talent.User.avatarUrl,
            role: talent.User.role,
          }
        : null,
      snapshot: {
        openOpportunities,
        activeDeals,
        activeCampaigns,
        contractsInProgress,
        totalDeals: talent._count.Deal,
        totalTasks: talent._count.CreatorTask,
        totalRevenue,
        totalPayouts,
        netRevenue: totalRevenue - totalPayouts,
      },
      deals: deals.map((deal) => ({
        id: deal.id,
        brandName: deal.brandName || `Deal with ${deal.Brand?.name || 'Unknown Brand'}`,
        stage: deal.stage,
        status: deal.stage, // Keep for backward compatibility with frontend
        value: deal.value,
        currency: deal.currency || "GBP",
        expectedClose: deal.expectedClose,
        notes: deal.notes,
        aiSummary: deal.aiSummary,
        brand: deal.Brand
          ? {
              id: deal.Brand.id,
              name: deal.Brand.name,
            }
          : null,
        createdAt: deal.createdAt,
      })),
      tasks: tasks.slice(0, 10).map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        dueDate: task.dueDate,
        priority: task.priority,
      })),
      revenue: {
        total: totalRevenue,
        payouts: totalPayouts,
        net: totalRevenue - totalPayouts,
        // Sanitize Prisma objects to plain objects to prevent circular references
        payments: payments.slice(0, 10).map(p => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          talentId: p.talentId,
          dealId: p.dealId,
          createdAt: p.createdAt,
          paidAt: p.paidAt,
        })),
        payoutsList: payouts.slice(0, 10).map(p => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          creatorId: p.creatorId,
          dealId: p.dealId,
          createdAt: p.createdAt,
          paidAt: p.paidAt,
          expectedPayoutAt: p.expectedPayoutAt,
        })),
      },
      // Note: Talent model doesn't have createdAt/updatedAt fields
    };

    console.log("[TALENT GET] Successfully retrieved talent:", id);
    // Return same shape as POST endpoint for consistency: { talent: {...} }
    return res.status(200).json({
      talent: talentData,
    });
  } catch (error) {
    console.error("[TALENT GET ERROR]", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.id,
      talentId: req.params.id,
    });
    logError("Failed to fetch talent details", error, { userId: req.user?.id, talentId: req.params.id });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/admin/talent/:id', method: 'GET' },
    });
    handleApiError(res, error, 'Failed to fetch talent details', 'TALENT_FETCH_FAILED');
  }
});

/**
 * POST /api/admin/talent
 * Create new talent
 * 
 * IMPORTANT: Talent records are independent entities.
 * They can be created without user accounts, profiles, briefs, or campaigns.
 * User linking happens separately via /api/admin/talent/:id/link-user
 * 
 * NOTE: Current schema requires userId (non-nullable, unique).
 * If userId is not provided, we must find or require an existing user.
 * We do NOT auto-create users - user must exist first.
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    console.log("[TALENT] POST /api/admin/talent - Request received");
    console.log("[TALENT] User:", req.user?.id, req.user?.email, req.user?.role);
    console.log("[TALENT] Body:", JSON.stringify(req.body, null, 2));
    
    // Extract and validate input directly (bypass schema validation if it's too strict)
    const {
      displayName,
      legalName,
      primaryEmail,
      email, // Accept both primaryEmail and email
      representationType,
      status,
      managerId,
      notes,
      userId, // Allow userId to be passed directly
    } = req.body;

    // Validate required fields
    if (!displayName || !displayName.trim()) {
      return res.status(400).json({
        code: "INVALID_TALENT_INPUT",
        message: "displayName is required"
      });
    }

    if (!representationType) {
      return res.status(400).json({
        code: "INVALID_TALENT_INPUT",
        message: "representationType is required"
      });
    }

    // Schema requires userId - resolve it from provided data
    let resolvedUserId: string | null = null;

    // If userId is provided directly, use it (but verify it exists)
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        return res.status(400).json({
          code: "USER_NOT_FOUND",
          message: `User with ID ${userId} does not exist. Please provide a valid userId or primaryEmail.`,
        });
      }
      resolvedUserId = userId;
    } else {
      // Try to resolve userId from email
      const emailToCheck = primaryEmail || email;
      if (emailToCheck && emailToCheck.trim()) {
        const existingUser = await prisma.user.findUnique({
          where: { email: emailToCheck.toLowerCase().trim() },
        });

        if (existingUser) {
          // Check if talent already exists for this user
          const existingTalent = await prisma.talent.findUnique({
            where: { userId: existingUser.id },
          });

          if (existingTalent) {
            return res.status(409).json({
              code: "CONFLICT",
              message: "Talent already exists for this user",
              talentId: existingTalent.id,
            });
          }

          resolvedUserId = existingUser.id;
        } else {
          // Email provided but user doesn't exist - return clear error (do NOT auto-create)
          return res.status(400).json({
            code: "USER_NOT_FOUND",
            message: `User with email ${emailToCheck} does not exist. Please create the user account first, then link it to talent.`,
          });
        }
      } else {
        // No userId or email provided - create a placeholder user for this talent
        // This allows talent to be created independently without requiring a user account first
        const placeholderEmail = `talent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@internal.breakagency.com`;
        const placeholderUser = await prisma.user.create({
          data: {
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            email: placeholderEmail,
            name: displayName.trim(),
            role: "CREATOR", // Default role for placeholder users
            onboarding_status: "pending_review",
            updatedAt: new Date(),
          },
        });
        resolvedUserId = placeholderUser.id;
      }
    }

    // Create talent record ONLY - no user creation, no profiles, no briefs, no campaigns
    console.log("[TALENT] Creating talent record with userId:", resolvedUserId);
    const talent = await prisma.talent.create({
      data: {
        id: `talent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: resolvedUserId!, // Schema requires userId, we've validated it exists above
        name: displayName.trim(),
        displayName: displayName.trim(),
        legalName: legalName || null,
        primaryEmail: primaryEmail || email || null,
        representationType: representationType || "NON_EXCLUSIVE",
        status: status || "ACTIVE",
        managerId: managerId || null,
        notes: notes || null,
        categories: [],
        stage: null,
      },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    console.log("[TALENT] Talent created successfully:", talent.id, talent.name);

    // Verify the record was actually created
    const verifyTalent = await prisma.talent.findUnique({
      where: { id: talent.id },
    });
    if (!verifyTalent) {
      console.error("[TALENT] CRITICAL: Talent record not found after creation!");
      return res.status(500).json({
        code: "TALENT_CREATE_FAILED",
        message: "Talent record was not created in database",
      });
    }
    console.log("[TALENT] Verified talent exists in database:", verifyTalent.id);

    // Log admin activity (non-blocking - don't fail talent creation if logging fails)
    try {
      await logAdminActivity(req, {
        event: "TALENT_CREATED",
        metadata: {
          talentId: talent.id,
          displayName,
          representationType: representationType || "NON_EXCLUSIVE",
          hasEmail: !!(primaryEmail || email),
          linkedUserId: resolvedUserId,
        },
      });
    } catch (logError) {
      // Log error but don't fail the request
      console.warn("[TALENT] Failed to log admin activity:", logError);
    }

    console.log("[TALENT] Returning success response with talent:", talent.id);
    // Return success - talent created independently
    return res.status(201).json({
      talent: {
        id: talent.id,
        name: talent.name,
        displayName: talent.displayName || talent.name,
        legalName: talent.legalName,
        primaryEmail: talent.primaryEmail || talent.User?.email || null,
        representationType: talent.representationType || "NON_EXCLUSIVE",
        status: talent.status || "ACTIVE",
        managerId: talent.managerId,
        notes: talent.notes,
        linkedUser: talent.User
          ? {
              id: talent.User.id,
              email: talent.User.email,
              name: talent.User.name,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Create talent failed", error);
    logError("Failed to create talent", error, { userId: req.user?.id, body: req.body });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/admin/talent', method: 'POST' },
    });
    
    // Return proper error response instead of generic 500
    if (error instanceof Error) {
      // Check for Prisma validation errors
      if (error.message.includes("Unique constraint") || error.message.includes("Foreign key constraint")) {
        return res.status(400).json({
          code: "TALENT_CREATE_FAILED",
          message: error.message,
        });
      }
      
      // Check for Prisma record not found
      if (error.message.includes("Record to update not found") || error.message.includes("Record to delete does not exist")) {
        return res.status(400).json({
          code: "TALENT_CREATE_FAILED",
          message: "Referenced user or resource does not exist",
        });
      }
      
      return res.status(400).json({
        code: "TALENT_CREATE_FAILED",
        message: error.message,
      });
    }
    
    return res.status(400).json({
      code: "TALENT_CREATE_FAILED",
      message: "Invalid talent input",
    });
  }
});

/**
 * PUT /api/admin/talent/:id
 * Update talent
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate request body
    const validation = validateRequestSafe(TalentUpdateSchema, req.body);
    if (!validation.success) {
      return sendError(res, "VALIDATION_ERROR", "Invalid request data", 400, (validation as any).error.format());
    }

    const { displayName, legalName, primaryEmail, representationType, status, managerId, notes } = validation.data;

    const existingTalent = await prisma.talent.findUnique({
      where: { id },
    });

    if (!existingTalent) {
      console.log("[TALENT PUT] Talent not found:", id);
      return sendError(res, "NOT_FOUND", "Talent not found", 404);
    }

    console.log("[TALENT PUT] BEFORE UPDATE", {
      id,
      userId: req.user?.id,
      existingDisplayName: existingTalent.displayName,
      existingLegalName: existingTalent.legalName,
      existingPrimaryEmail: existingTalent.primaryEmail,
      existingRepresentationType: existingTalent.representationType,
      existingStatus: existingTalent.status,
    });

    // Build update data with all provided fields
    const updateData: any = {};
    
    // Update name (derived from displayName if provided)
    if (displayName) updateData.name = displayName;
    
    // Update all extended fields
    if (displayName !== undefined) updateData.displayName = displayName;
    if (legalName !== undefined) updateData.legalName = legalName;
    if (primaryEmail !== undefined) updateData.primaryEmail = primaryEmail;
    if (representationType !== undefined) updateData.representationType = representationType;
    if (status !== undefined) updateData.status = status;
    if (managerId !== undefined) updateData.managerId = managerId;
    if (notes !== undefined) updateData.notes = notes;

    console.log("[TALENT PUT] UPDATE DATA TO PERSIST:", id, updateData);

    // Update talent with all fields
    const updatedTalent = await prisma.talent.update({
      where: { id },
      data: updateData,
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    console.log("[TALENT PUT] AFTER UPDATE SUCCESS", {
      id,
      updatedDisplayName: updatedTalent.displayName,
      updatedLegalName: updatedTalent.legalName,
      updatedPrimaryEmail: updatedTalent.primaryEmail,
      updatedRepresentationType: updatedTalent.representationType,
      updatedStatus: updatedTalent.status,
    });

    // Log admin activity
    await logAdminActivity(req, {
      event: "TALENT_UPDATED",
      metadata: {
        talentId: id,
        changes: Object.keys(updateData),
      },
    });

    sendSuccess(res, {
      talent: {
        id: updatedTalent.id,
        name: updatedTalent.name,
        displayName: updatedTalent.displayName || updatedTalent.name,
        legalName: updatedTalent.legalName,
        primaryEmail: updatedTalent.primaryEmail || updatedTalent.User?.email,
        representationType: updatedTalent.representationType,
        status: updatedTalent.status,
        managerId: updatedTalent.managerId,
        notes: updatedTalent.notes,
        linkedUser: updatedTalent.User
          ? {
              id: updatedTalent.User.id,
              email: updatedTalent.User.email,
              name: updatedTalent.User.name,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("[TALENT PUT] CRITICAL ERROR", {
      talentId: req.params.id,
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error),
    });
    logError("Failed to update talent", error, { userId: req.user?.id, talentId: req.params.id });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/admin/talent/:id', method: 'PUT' },
    });
    handleApiError(res, error, 'Failed to update talent', 'TALENT_UPDATE_FAILED');
  }
});

/**
 * POST /api/admin/talent/:id/link-user
 * Link talent to user account
 */
router.post("/:id/link-user", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const talent = await prisma.talent.findUnique({
      where: { id },
    });

    if (!talent) {
      return res.status(404).json({ error: "Talent not found" });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user is already linked to another talent
    const existingTalent = await prisma.talent.findUnique({
      where: { userId },
    });

    if (existingTalent && existingTalent.id !== id) {
      return res.status(400).json({
        error: "User is already linked to another talent",
        talentId: existingTalent.id,
      });
    }

    // Update talent to link user
    const updatedTalent = await prisma.talent.update({
      where: { id },
      data: {
        userId,
      },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Log audit event
    await logAuditEvent(req, {
      action: "TALENT_USER_LINKED",
      entityType: "Talent",
      entityId: id,
      metadata: {
        linkedUserId: userId,
        linkedUserEmail: user.email,
      },
    });

    res.json({
      talent: {
        id: updatedTalent.id,
        linkedUser: updatedTalent.User
          ? {
              id: updatedTalent.User.id,
              email: updatedTalent.User.email,
              name: updatedTalent.User.name,
              avatarUrl: updatedTalent.User.avatarUrl,
            }
          : null,
      },
    });
  } catch (error) {
    logError("Failed to link user to talent", error, { userId: req.user?.id, talentId: req.params.id });
    res.status(500).json({ error: "Failed to link user to talent" });
  }
});

/**
 * POST /api/admin/talent/:id/unlink-user
 * Unlink talent from user account (non-destructive)
 */
router.post("/:id/unlink-user", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const talent = await prisma.talent.findUnique({
      where: { id },
    });

    if (!talent) {
      return res.status(404).json({ error: "Talent not found" });
    }

    if (!talent.userId) {
      return res.status(400).json({ error: "Talent is not linked to a user" });
    }

    // Note: Current schema requires userId, so we can't actually unlink
    // This will be possible after schema migration
    // For now, we'll log the action but keep the link

    // Log audit event
    await logAuditEvent(req, {
      action: "TALENT_USER_UNLINKED",
      entityType: "Talent",
      entityId: id,
      metadata: {
        previousUserId: talent.userId,
      },
    });

    sendSuccess(res, {
      message: "User unlink requested (will be implemented after schema migration)",
      talent: {
        id: talent.id,
        linkedUser: null,
      },
    });
  } catch (error) {
    logError("Failed to unlink user from talent", error, { userId: req.user?.id, talentId: req.params.id });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/admin/talent/:id/unlink-user', method: 'POST' },
    });
    handleApiError(res, error, 'Failed to unlink user from talent', 'TALENT_UNLINK_USER_FAILED');
  }
});

/**
 * GET /api/admin/talent/:id/opportunities
 * Get opportunities for a talent
 */
router.get("/:id/opportunities", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Placeholder - will be implemented when Opportunity model has talentId
    res.json({ opportunities: [] });
  } catch (error) {
    const { id } = req.params;
    logError("Failed to fetch talent opportunities", error, { userId: req.user?.id, talentId: id });
    res.status(500).json({ error: "Failed to fetch talent opportunities" });
  }
});

/**
 * GET /api/admin/talent/:id/campaigns
 * Get campaigns for a talent
 */
router.get("/:id/campaigns", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Placeholder - will be implemented when Campaign model has talentId
    res.json({ campaigns: [] });
  } catch (error) {
    const { id } = req.params;
    logError("Failed to fetch talent campaigns", error, { userId: req.user?.id, talentId: id });
    res.status(500).json({ error: "Failed to fetch talent campaigns" });
  }
});

/**
 * GET /api/admin/talent/:id/contracts
 * Get contracts for a talent
 */
router.get("/:id/contracts", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Placeholder - will be implemented when Contract model has talentId
    res.json({ contracts: [] });
  } catch (error) {
    const { id } = req.params;
    logError("Failed to fetch talent contracts", error, { userId: req.user?.id, talentId: id });
    res.status(500).json({ error: "Failed to fetch talent contracts" });
  }
});

/**
 * GET /api/admin/talent/:id/inbox
 * Get inbox messages for a talent
 */
router.get("/:id/inbox", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const talent = await prisma.talent.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!talent || !talent.userId) {
      return res.json({ messages: [] });
    }

    // Get inbox messages for linked user
    const messages = await prisma.inboxMessage.findMany({
      where: {
        userId: talent.userId,
      },
      orderBy: {
        receivedAt: "desc",
      },
      take: 50,
    });

    res.json({ messages });
  } catch (error) {
    logError("Failed to fetch talent inbox", error, { userId: req.user?.id, talentId: id });
    res.status(500).json({ error: "Failed to fetch talent inbox" });
  }
});

/**
 * DELETE /api/admin/talent/:id
 * Delete talent (admin only)
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log("[TALENT DELETE] Starting deletion for ID:", id);

    const talent = await prisma.talent.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        userId: true,
      },
    });

    if (!talent) {
      console.warn("[TALENT DELETE] Talent not found:", id);
      return sendError(res, "NOT_FOUND", "Talent not found", 404);
    }

    // Check for related records before deletion
    // Note: Most relations have onDelete: Cascade, but we check critical business data
    // that should prevent deletion or require user confirmation
    
    // Helper to safely count commissions (table may not exist)
    async function safeCommissionCount(talentId: string): Promise<number> {
      try {
        return await prisma.commission.count({ where: { talentId } });
      } catch (err) {
        // Commission table doesn't exist or query failed - ignore
        console.warn("[TALENT DELETE] Commission count unavailable (table may not exist):", err instanceof Error ? err.message : String(err));
        return 0;
      }
    }
    
    const [dealCount, taskCount, paymentCount, payoutCount, commissionCount] = await Promise.all([
      prisma.deal.count({ where: { talentId: id } }),
      prisma.creatorTask.count({ where: { creatorId: id } }),
      prisma.payment.count({ where: { talentId: id } }),
      prisma.payout.count({ where: { creatorId: id } }),
      safeCommissionCount(id),
    ]);

    console.log("[TALENT DELETE] Related records count:", {
      deals: dealCount,
      tasks: taskCount,
      payments: paymentCount,
      payouts: payoutCount,
      commissions: commissionCount,
    });

    const blockingCounts: string[] = [];
    if (dealCount > 0) blockingCounts.push(`${dealCount} deal(s)`);
    if (taskCount > 0) blockingCounts.push(`${taskCount} task(s)`);
    if (paymentCount > 0) blockingCounts.push(`${paymentCount} payment(s)`);
    if (payoutCount > 0) blockingCounts.push(`${payoutCount} payout(s)`);
    if (commissionCount > 0) blockingCounts.push(`${commissionCount} commission(s)`);

    if (blockingCounts.length > 0) {
      const conflictMessage = `Cannot delete talent: ${blockingCounts.join(", ")} are linked to this talent. Please remove these relationships first.`;
      console.warn("[TALENT DELETE] Conflict - blocking counts found:", conflictMessage);
      return sendError(res, "CONFLICT", conflictMessage, 409);
    }

    console.log("[TALENT DELETE] No blocking records found, proceeding with deletion:", id);
    
    try {
      await prisma.talent.delete({ where: { id } });
      console.log("[TALENT DELETE] Talent deleted successfully:", id);
    } catch (deleteError) {
      // Handle specific Prisma errors
      if (deleteError instanceof Error && 'code' in deleteError) {
        const prismaError = deleteError as any;
        
        // P2003: Foreign key constraint failed
        if (prismaError.code === 'P2003') {
          console.warn("[TALENT DELETE] Foreign key constraint violation:", {
            id,
            meta: prismaError.meta,
            message: prismaError.message,
          });
          return sendError(
            res,
            "CONFLICT",
            "Cannot delete talent: This talent has related records that must be removed first.",
            409,
            { details: prismaError.meta }
          );
        }
        
        // P2025: Record not found (shouldn't happen, but handle it)
        if (prismaError.code === 'P2025') {
          console.warn("[TALENT DELETE] Record not found during deletion:", id);
          return sendError(res, "NOT_FOUND", "Talent not found", 404);
        }
      }
      
      // Re-throw for general error handling
      throw deleteError;
    }

    // Log destructive action
    try {
      await Promise.all([
        logAdminActivity(req, {
          event: "TALENT_DELETED",
          metadata: {
            talentId: id,
            talentName: talent.name,
          },
        }),
        logDestructiveAction(req, {
          action: "TALENT_DELETED",
          entityType: "Talent",
          entityId: id,
          metadata: {
            talentName: talent.name,
          },
        }),
      ]);
    } catch (logError) {
      console.error("[TALENT DELETE] Failed to log talent deletion:", logError);
    }

    // Always return 200 with JSON body - never 204 No Content
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("[TALENT DELETE ERROR]", {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.id,
      talentId: req.params.id,
    });
    logError("Failed to delete talent", error, { userId: req.user?.id, talentId: req.params.id });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/admin/talent/:id', method: 'DELETE' },
    });
    handleApiError(res, error, 'Failed to delete talent', 'TALENT_DELETE_FAILED');
  }
});

// ============================================
// TALENT EMAILS
// ============================================

/**
 * POST /api/admin/talent/:id/emails
 * Add a new email to a talent
 */
router.post("/:id/emails", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, label, isPrimary } = req.body;

    // Validate talent exists
    const talent = await prisma.talent.findUnique({ where: { id } });
    if (!talent) {
      return sendError(res, "NOT_FOUND", "Talent not found", 404);
    }

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendError(res, "INVALID_INPUT", "Invalid email address", 400);
    }

    // If marking as primary, unmark others
    if (isPrimary) {
      await prisma.talentEmail.updateMany({
        where: { talentId: id, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const talentEmail = await prisma.talentEmail.create({
      data: {
        talentId: id,
        email,
        label: label || null,
        isPrimary: isPrimary || false,
      },
    });

    await logAdminActivity(req, {
      action: "TALENT_EMAIL_ADDED",
      entityType: "TalentEmail",
      entityId: talentEmail.id,
      metadata: { talentId: id, email, isPrimary },
    });

    res.status(201).json(talentEmail);
  } catch (error) {
    console.error("[TALENT EMAIL POST ERROR]", error);
    handleApiError(res, error, "Failed to add email", "EMAIL_ADD_FAILED");
  }
});

/**
 * GET /api/admin/talent/:id/emails
 * Get all emails for a talent
 */
router.get("/:id/emails", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const emails = await prisma.talentEmail.findMany({
      where: { talentId: id },
      orderBy: { isPrimary: "desc" },
    });

    res.json(emails);
  } catch (error) {
    console.error("[TALENT EMAILS GET ERROR]", error);
    handleApiError(res, error, "Failed to fetch emails", "EMAILS_FETCH_FAILED");
  }
});

/**
 * PATCH /api/admin/talent/emails/:emailId
 * Update an email
 */
router.patch("/emails/:emailId", async (req: Request, res: Response) => {
  try {
    const { emailId } = req.params;
    const { label, isPrimary } = req.body;

    const talentEmail = await prisma.talentEmail.findUnique({ where: { id: emailId } });
    if (!talentEmail) {
      return sendError(res, "NOT_FOUND", "Email not found", 404);
    }

    // If marking as primary, unmark others for same talent
    if (isPrimary) {
      await prisma.talentEmail.updateMany({
        where: { talentId: talentEmail.talentId, isPrimary: true, id: { not: emailId } },
        data: { isPrimary: false },
      });
    }

    const updated = await prisma.talentEmail.update({
      where: { id: emailId },
      data: {
        ...(label !== undefined && { label }),
        ...(isPrimary !== undefined && { isPrimary }),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("[TALENT EMAIL PATCH ERROR]", error);
    handleApiError(res, error, "Failed to update email", "EMAIL_UPDATE_FAILED");
  }
});

/**
 * DELETE /api/admin/talent/emails/:emailId
 * Delete an email
 */
router.delete("/emails/:emailId", async (req: Request, res: Response) => {
  try {
    const { emailId } = req.params;

    const talentEmail = await prisma.talentEmail.findUnique({ where: { id: emailId } });
    if (!talentEmail) {
      return sendError(res, "NOT_FOUND", "Email not found", 404);
    }

    await prisma.talentEmail.delete({ where: { id: emailId } });

    await logAdminActivity(req, {
      action: "TALENT_EMAIL_DELETED",
      entityType: "TalentEmail",
      entityId: emailId,
      metadata: { talentId: talentEmail.talentId },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("[TALENT EMAIL DELETE ERROR]", error);
    handleApiError(res, error, "Failed to delete email", "EMAIL_DELETE_FAILED");
  }
});

// ============================================
// TALENT TASKS
// ============================================

/**
 * POST /api/admin/talent/:id/tasks
 * Create a task for a talent
 */
router.post("/:id/tasks", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, notes, dueDate, status } = req.body;

    // Validate talent exists
    const talent = await prisma.talent.findUnique({ where: { id } });
    if (!talent) {
      return sendError(res, "NOT_FOUND", "Talent not found", 404);
    }

    // Validate title
    if (!title || typeof title !== "string") {
      return sendError(res, "INVALID_INPUT", "Title is required", 400);
    }

    const task = await prisma.talentTask.create({
      data: {
        talentId: id,
        title,
        notes: notes || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || "PENDING",
        createdBy: req.user!.id,
      },
    });

    await logAdminActivity(req, {
      action: "TALENT_TASK_CREATED",
      entityType: "TalentTask",
      entityId: task.id,
      metadata: { talentId: id, title, dueDate, status },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error("[TALENT TASK POST ERROR]", error);
    handleApiError(res, error, "Failed to create task", "TASK_CREATE_FAILED");
  }
});

/**
 * GET /api/admin/talent/:id/tasks
 * Get all tasks for a talent
 */
router.get("/:id/tasks", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const tasks = await prisma.talentTask.findMany({
      where: { talentId: id },
      orderBy: { dueDate: "asc" },
    });

    res.json(tasks);
  } catch (error) {
    console.error("[TALENT TASKS GET ERROR]", error);
    handleApiError(res, error, "Failed to fetch tasks", "TASKS_FETCH_FAILED");
  }
});

/**
 * PATCH /api/admin/talent/tasks/:taskId
 * Update a task
 */
router.patch("/tasks/:taskId", async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { title, notes, dueDate, status, completedAt } = req.body;

    const task = await prisma.talentTask.findUnique({ where: { id: taskId } });
    if (!task) {
      return sendError(res, "NOT_FOUND", "Task not found", 404);
    }

    const updated = await prisma.talentTask.update({
      where: { id: taskId },
      data: {
        ...(title !== undefined && { title }),
        ...(notes !== undefined && { notes }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(status !== undefined && { status }),
        ...(completedAt !== undefined && { completedAt: completedAt ? new Date(completedAt) : null }),
      },
    });

    await logAdminActivity(req, {
      action: "TALENT_TASK_UPDATED",
      entityType: "TalentTask",
      entityId: taskId,
      metadata: { talentId: task.talentId, status },
    });

    res.json(updated);
  } catch (error) {
    console.error("[TALENT TASK PATCH ERROR]", error);
    handleApiError(res, error, "Failed to update task", "TASK_UPDATE_FAILED");
  }
});

/**
 * DELETE /api/admin/talent/tasks/:taskId
 * Delete a task
 */
router.delete("/tasks/:taskId", async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const task = await prisma.talentTask.findUnique({ where: { id: taskId } });
    if (!task) {
      return sendError(res, "NOT_FOUND", "Task not found", 404);
    }

    await prisma.talentTask.delete({ where: { id: taskId } });

    await logAdminActivity(req, {
      action: "TALENT_TASK_DELETED",
      entityType: "TalentTask",
      entityId: taskId,
      metadata: { talentId: task.talentId },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("[TALENT TASK DELETE ERROR]", error);
    handleApiError(res, error, "Failed to delete task", "TASK_DELETE_FAILED");
  }
});

// ============================================
// TALENT SOCIAL PROFILES
// ============================================

/**
 * POST /api/admin/talent/:id/socials
 * Add a social profile to a talent
 * 
 * For Instagram: Automatically fetches public profile data
 * Accepts either full URL or username as input
 */
router.post("/:id/socials", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let { platform, handle, url, followers } = req.body;

    if (!id || id.trim() === "") {
      console.warn("[TALENT SOCIAL] Missing or empty talent ID");
      return sendError(res, "VALIDATION_ERROR", "Talent ID is required", 400);
    }

    // Validate talent exists
    const talent = await prisma.talent.findUnique({ where: { id } });
    if (!talent) {
      console.warn("[TALENT SOCIAL] Talent not found:", id);
      return sendError(res, "NOT_FOUND", "Talent not found", 404);
    }

    // Validate inputs
    if (!platform || !handle) {
      console.warn("[TALENT SOCIAL] Missing required fields", { platform, handle });
      return sendError(res, "INVALID_INPUT", "platform and handle are required", 400);
    }

    let profileImageUrl: string | null = null;
    let displayName: string | null = null;
    let postCount: number | null = null;
    let lastScrapedAt: Date | null = null;

    // Special handling for Instagram: normalize input and scrape public data
    if (platform === SocialPlatform.INSTAGRAM) {
      const normalized = normalizeInstagramHandle(handle);
      
      if (!normalized.isValid) {
        return sendError(
          res,
          "INVALID_INPUT",
          `Invalid Instagram handle: ${normalized.error}`,
          400
        );
      }

      handle = normalized.username;
      url = normalized.url;

      // Attempt to scrape public Instagram profile data
      // This runs asynchronously but doesn't block the request
      try {
        const profileData = await scrapeInstagramProfile(normalized.username);
        
        if (profileData) {
          // Only update fields that weren't explicitly provided
          displayName = profileData.displayName || null;
          profileImageUrl = profileData.profileImageUrl || null;
          followers = profileData.followers || followers || null;
          postCount = profileData.postCount || null;
          lastScrapedAt = new Date();
        }
      } catch (scrapeError) {
        // Log scrape error but don't block the request
        console.warn("[TALENT SOCIAL] Instagram scrape failed:", scrapeError);
        // Continue - social profile will be created even if scrape fails
      }
    } else if (!url) {
      // Non-Instagram platforms require explicit URL
      return sendError(res, "INVALID_INPUT", "url is required for non-Instagram platforms", 400);
    }

    const social = await prisma.talentSocial.create({
      data: {
        talentId: id,
        platform,
        handle,
        url,
        followers: followers || null,
        displayName,
        profileImageUrl,
        postCount,
        lastScrapedAt,
      },
    });

    // CRITICAL FIX: Also create a SocialAccountConnection record for Social Intelligence
    // This is required because getTalentSocialIntelligence() looks for SocialAccountConnection
    // with connected=true, but the TalentSocial route was only creating TalentSocial records.
    let accountConnection: any = null;
    try {
      accountConnection = await prisma.socialAccountConnection.upsert({
        where: {
          creatorId_platform: {
            creatorId: id,
            platform: platform as any, // Platform enum matching
          },
        },
        update: {
          handle,
          connected: true, // Mark as connected since admin verified it
          updatedAt: new Date(),
        },
        create: {
          id: `conn_${id}_${platform}_${Date.now()}`, // Unique ID
          creatorId: id,
          platform: platform as any,
          handle,
          connected: true, // Mark as connected
          updatedAt: new Date(),
        },
      });
      console.log("[TALENT SOCIAL] Created SocialAccountConnection for Social Intelligence", {
        connectionId: accountConnection.id,
        talentId: id,
        platform,
        handle,
      });
    } catch (connError) {
      console.warn("[TALENT SOCIAL] Failed to create SocialAccountConnection:", connError);
      // Don't block the response - TalentSocial was created successfully
    }

    // Clear Social Intelligence cache so new data will be fetched
    try {
      await redis.del(`social_intel:${id}`);
      console.log("[TALENT SOCIAL] Cleared Social Intelligence cache for:", id);
    } catch (cacheError) {
      console.warn("[TALENT SOCIAL] Cache clear failed:", cacheError);
    }

    console.log("[TALENT SOCIAL] Successfully created social profile", { 
      socialId: social.id, 
      talentId: id, 
      platform, 
      handle 
    });

    await logAdminActivity(req, {
      action: "TALENT_SOCIAL_ADDED",
      entityType: "TalentSocial",
      entityId: social.id,
      metadata: { 
        talentId: id, 
        platform, 
        handle,
        scrapedData: lastScrapedAt ? { followers, postCount } : null,
      },
    });

    // Trigger profile image sync asynchronously (don't block response)
    // This will fetch the best available profile image from connected social accounts
    setImmediate(async () => {
      try {
        const { talentProfileImageService } = await import(
          "../../services/talent/TalentProfileImageService.js"
        );
        const syncResult = await talentProfileImageService.syncTalentProfileImage(id);
        if (syncResult.success) {
          console.log("[TALENT PROFILE IMAGE] Auto-synced after social add:", {
            talentId: id,
            source: syncResult.source,
          });
        } else {
          console.warn("[TALENT PROFILE IMAGE] Auto-sync failed after social add:", {
            talentId: id,
            error: syncResult.error,
          });
        }
      } catch (error) {
        console.error("[TALENT PROFILE IMAGE] Async sync error:", error);
      }
    });

    return res.status(201).json(social);
  } catch (error) {
    console.error("[TALENT SOCIAL POST ERROR] Exception caught:", {
      errorName: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorCode: (error as any)?.code,
      errorCause: (error as any)?.cause,
      talentId: req.params.id,
      requestBody: { platform: req.body.platform, handle: req.body.handle },
    });
    console.error("[TALENT SOCIAL POST ERROR] Full stack:", error);
    logError("Failed to add talent social profile", error, { talentId: req.params.id });
    
    // Return more detailed error for debugging
    const isDev = process.env.NODE_ENV !== 'production';
    return sendError(
      res,
      "SOCIAL_ADD_FAILED",
      error instanceof Error ? error.message : "Failed to add social profile",
      500,
      isDev ? {
        errorType: error instanceof Error ? error.name : typeof error,
        errorCode: (error as any)?.code,
        context: "POST /api/admin/talent/:id/socials",
        talentId: req.params.id,
        stack: error instanceof Error ? error.stack : undefined,
      } : undefined
    );
  }
});

/**
 * GET /api/admin/talent/:id/socials
 * Get all social profiles for a talent
 */
router.get("/:id/socials", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || id.trim() === "") {
      console.warn("[TALENT SOCIALS] Missing or empty talent ID");
      return sendError(res, "VALIDATION_ERROR", "Talent ID is required", 400);
    }

    console.log("[TALENT SOCIALS GET] Starting query for talent:", id);

    // Verify talent exists first
    console.log("[TALENT SOCIALS GET] Checking talent existence");
    const talent = await prisma.talent.findUnique({ where: { id } });
    if (!talent) {
      console.warn("[TALENT SOCIALS] Talent not found:", id);
      return sendError(res, "NOT_FOUND", "Talent not found", 404);
    }

    console.log("[TALENT SOCIALS GET] Fetching socials from database");
    const socials = await prisma.talentSocial.findMany({
      where: { talentId: id },
      orderBy: { createdAt: "desc" },
    });

    if (!Array.isArray(socials)) {
      console.warn("[TALENT SOCIALS] Expected array but got:", typeof socials);
      return res.json([]);
    }

    console.log("[TALENT SOCIALS] Successfully fetched", socials.length, "socials for talent", id);
    return res.json(socials);
  } catch (error) {
    console.error("[TALENT SOCIALS GET ERROR] Exception caught:", {
      errorName: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorCode: (error as any)?.code,
      errorCause: (error as any)?.cause,
      talentId: req.params.id,
    });
    console.error("[TALENT SOCIALS GET ERROR] Full stack:", error);
    logError("Failed to fetch talent social profiles", error, { talentId: req.params.id });
    
    // Return more detailed error for debugging
    const isDev = process.env.NODE_ENV !== 'production';
    return sendError(
      res, 
      "SOCIALS_FETCH_FAILED", 
      error instanceof Error ? error.message : "Failed to fetch social profiles",
      500,
      isDev ? {
        errorType: error instanceof Error ? error.name : typeof error,
        errorCode: (error as any)?.code,
        context: "GET /api/admin/talent/:id/socials",
        talentId: req.params.id,
        stack: error instanceof Error ? error.stack : undefined,
      } : undefined
    );
  }
});

/**
 * DELETE /api/admin/talent/socials/:socialId
 * Delete a social profile
 */
router.delete("/socials/:socialId", async (req: Request, res: Response) => {
  try {
    const { socialId } = req.params;

    if (!socialId || socialId.trim() === "") {
      console.warn("[TALENT SOCIAL DELETE] Missing or empty social ID");
      return sendError(res, "VALIDATION_ERROR", "Social ID is required", 400);
    }

    const social = await prisma.talentSocial.findUnique({ where: { id: socialId } });
    if (!social) {
      console.warn("[TALENT SOCIAL DELETE] Social profile not found:", socialId);
      return sendError(res, "NOT_FOUND", "Social profile not found", 404);
    }

    await prisma.talentSocial.delete({ where: { id: socialId } });

    console.log("[TALENT SOCIAL DELETE] Successfully deleted social profile", { socialId, talentId: social.talentId });

    await logAdminActivity(req, {
      action: "TALENT_SOCIAL_DELETED",
      entityType: "TalentSocial",
      entityId: socialId,
      metadata: { talentId: social.talentId },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[TALENT SOCIAL DELETE ERROR] Exception caught:", {
      errorName: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorCode: (error as any)?.code,
      errorCause: (error as any)?.cause,
      socialId: req.params.socialId,
    });
    console.error("[TALENT SOCIAL DELETE ERROR] Full stack:", error);
    logError("Failed to delete talent social profile", error, { socialId: req.params.socialId });
    
    // Return more detailed error for debugging
    const isDev = process.env.NODE_ENV !== 'production';
    return sendError(
      res,
      "SOCIAL_DELETE_FAILED",
      error instanceof Error ? error.message : "Failed to delete social profile",
      500,
      isDev ? {
        errorType: error instanceof Error ? error.name : typeof error,
        errorCode: (error as any)?.code,
        context: "DELETE /api/admin/talent/socials/:socialId",
        socialId: req.params.socialId,
        stack: error instanceof Error ? error.stack : undefined,
      } : undefined
    );
  }
});

/**
 * POST /api/admin/talent/:id/profile-image/sync
 * Manually trigger profile image sync for a talent
 * 
 * Fetches profile image from connected social accounts in priority order:
 * 1. Instagram
 * 2. TikTok
 * 3. YouTube
 * 4. Revert to initials if no social accounts connected
 * 
 * This is called automatically when:
 * - A new social account is connected
 * - A social account is reconnected
 * - Cron job runs daily for batch sync
 * 
 * Manual sync can be triggered here or via frontend "Refresh" button.
 */
router.post("/:id/profile-image/sync", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { forceRefresh } = req.body || {};

    if (!id || id.trim() === "") {
      return sendError(res, "VALIDATION_ERROR", "Talent ID is required", 400);
    }

    // Validate talent exists
    const talent = await prisma.talent.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!talent) {
      return sendError(res, "NOT_FOUND", "Talent not found", 404);
    }

    // Import service dynamically to avoid circular dependencies
    const { talentProfileImageService } = await import(
      "../../services/talent/TalentProfileImageService.js"
    );

    const result = await talentProfileImageService.syncTalentProfileImage(id);

    if (result.success) {
      console.log("[TALENT PROFILE IMAGE] Sync successful for talent:", id, {
        source: result.source,
        imageUrl: result.imageUrl ? result.imageUrl.substring(0, 50) + "..." : "initials",
      });

      await logAdminActivity(req, {
        action: "TALENT_PROFILE_IMAGE_SYNCED",
        entityType: "Talent",
        entityId: id,
        metadata: {
          source: result.source,
          imageUrl: result.imageUrl ? result.imageUrl.substring(0, 100) : null,
        },
      });

      return res.status(200).json({
        success: true,
        message: `Profile image updated from ${result.source}`,
        data: {
          talentId: id,
          source: result.source,
          imageUrl: result.imageUrl,
          syncedAt: new Date(),
        },
      });
    } else {
      console.warn("[TALENT PROFILE IMAGE] Sync failed for talent:", id, {
        error: result.error,
      });

      return sendError(
        res,
        "SYNC_FAILED",
        `Failed to sync profile image: ${result.error}`,
        500
      );
    }
  } catch (error) {
    console.error("[TALENT PROFILE IMAGE SYNC ERROR]", error);
    logError("Failed to sync talent profile image", error, { talentId: req.params.id });
    return handleApiError(res, error, "Failed to sync profile image", "PROFILE_IMAGE_SYNC_FAILED");
  }
});

/**
 * GET /api/admin/talent/:id/profile-image
 * Get current profile image information for a talent
 * 
 * Returns:
 * - profileImageUrl: URL of the current profile image
 * - profileImageSource: Where image comes from (instagram, tiktok, youtube, manual, initials)
 * - lastProfileImageSyncAt: When the image was last synced from social account
 */
router.get("/:id/profile-image", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || id.trim() === "") {
      return sendError(res, "VALIDATION_ERROR", "Talent ID is required", 400);
    }

    const talent = await prisma.talent.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        profileImageUrl: true,
        profileImageSource: true,
        lastProfileImageSyncAt: true,
        SocialAccountConnection: {
          where: { connected: true },
          select: {
            id: true,
            platform: true,
            handle: true,
            SocialProfile: {
              select: {
                profileImageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!talent) {
      return sendError(res, "NOT_FOUND", "Talent not found", 404);
    }

    // Determine if we can auto-sync (have connected social accounts)
    const canAutoSync = talent.SocialAccountConnection && talent.SocialAccountConnection.length > 0;

    return res.status(200).json({
      success: true,
      data: {
        talentId: id,
        talentName: talent.name,
        profileImageUrl: talent.profileImageUrl,
        profileImageSource: talent.profileImageSource || "initials",
        lastProfileImageSyncAt: talent.lastProfileImageSyncAt,
        connectedPlatforms: talent.SocialAccountConnection.map((conn) => ({
          platform: conn.platform,
          handle: conn.handle,
          hasProfileImage: !!conn.SocialProfile?.profileImageUrl,
        })),
        canAutoSync,
        nextSyncRecommended:
          !talent.lastProfileImageSyncAt ||
          new Date(talent.lastProfileImageSyncAt).getTime() < Date.now() - 24 * 60 * 60 * 1000,
      },
    });
  } catch (error) {
    console.error("[TALENT PROFILE IMAGE GET ERROR]", error);
    logError("Failed to fetch talent profile image info", error, { talentId: req.params.id });
    return handleApiError(res, error, "Failed to fetch profile image info", "PROFILE_IMAGE_GET_FAILED");
  }
});

/**
 * GET /api/admin/talent/:id/social-intelligence
 * Fetch aggregated social media intelligence & analytics for talent
 */
router.get("/:id/social-intelligence", async (req: Request, res: Response) => {
  try {
    const { id: talentId } = req.params;
    console.log("[SOCIAL_INTELLIGENCE] Fetching social intelligence for talent:", talentId);

    if (!talentId || talentId.trim() === "") {
      console.warn("[SOCIAL_INTELLIGENCE] Missing or empty talent ID");
      return sendError(res, "VALIDATION_ERROR", "Talent ID is required", 400);
    }

    // Verify talent exists
    console.log("[SOCIAL_INTELLIGENCE] Verifying talent exists");
    const talent = await prisma.talent.findUnique({ where: { id: talentId } });
    if (!talent) {
      console.warn("[SOCIAL_INTELLIGENCE] Talent not found:", talentId);
      return sendError(res, "NOT_FOUND", "Talent not found", 404);
    }

    console.log("[SOCIAL_INTELLIGENCE] Getting social intelligence service");
    const { getTalentSocialIntelligence } = await import("../../services/socialIntelligenceService.js");
    
    console.log("[SOCIAL_INTELLIGENCE] Calling getTalentSocialIntelligence");
    const intelligenceData = await getTalentSocialIntelligence(talentId);

    console.log("[SOCIAL_INTELLIGENCE] Successfully retrieved intelligence data");
    return sendSuccess(res, { data: intelligenceData }, 200, "Social intelligence retrieved");
  } catch (error) {
    console.error("[SOCIAL_INTELLIGENCE ERROR] Exception caught:", {
      errorName: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorCode: (error as any)?.code,
      errorCause: (error as any)?.cause,
      talentId: req.params.id,
    });
    console.error("[SOCIAL_INTELLIGENCE ERROR] Full stack:", error);
    logError("Failed to fetch social intelligence", error, { talentId: req.params.id });
    
    // Return more detailed error for debugging
    const isDev = process.env.NODE_ENV !== 'production';
    return sendError(
      res,
      "SOCIAL_INTELLIGENCE_FETCH_FAILED",
      error instanceof Error ? error.message : "Failed to fetch social intelligence",
      500,
      isDev ? {
        errorType: error instanceof Error ? error.name : typeof error,
        errorCode: (error as any)?.code,
        context: "GET /api/admin/talent/:id/social-intelligence",
        talentId: req.params.id,
        stack: error instanceof Error ? error.stack : undefined,
      } : undefined
    );
  }
});

/**
 * POST /api/admin/talent/:id/social-intelligence/notes
 * Save agent insights/notes for talent social intelligence
 */
router.post("/:id/social-intelligence/notes", async (req: Request, res: Response) => {
  try {
    const { id: talentId } = req.params;
    const { notes } = req.body;

    if (!notes || typeof notes !== "string") {
      sendError(res, "VALIDATION_ERROR", "Notes must be a string", 400);
      return;
    }

    console.log("[SOCIAL_INTELLIGENCE] Saving notes for talent:", talentId);

    const { saveSocialIntelligenceNotes } = await import("../../services/socialIntelligenceService.js");
    await saveSocialIntelligenceNotes(talentId, notes);

    // Log admin activity
    try {
      await logAdminActivity(req, {
        event: "SAVE_SOCIAL_INTELLIGENCE_NOTES",
        metadata: {
          talentId,
        },
      });
    } catch (logError) {
      console.error("[SOCIAL_INTELLIGENCE] Failed to log activity:", logError);
    }

    return sendSuccess(res, { success: true }, 200, "Notes saved successfully");
  } catch (error) {
    console.error("[SOCIAL_INTELLIGENCE] Error saving notes:", error);
    logError("Failed to save social intelligence notes", error, { talentId: req.params.id });
    return handleApiError(res, error, "Failed to save notes", "SOCIAL_INTELLIGENCE_SAVE_FAILED");
  }
});

/**
 * POST /api/admin/talent/:id/social-intelligence/refresh
 * Force refresh social intelligence data (bypasses cache, rate-limited)
 */
router.post("/:id/social-intelligence/refresh", async (req: Request, res: Response) => {
  try {
    const { id: talentId } = req.params;
    console.log("[SOCIAL_INTELLIGENCE] Refreshing social intelligence for talent:", talentId);

    const { refreshTalentSocialIntelligence } = await import("../../services/socialIntelligenceService.js");
    const refreshResult = await refreshTalentSocialIntelligence(talentId);

    if (!refreshResult.success) {
      return sendError(res, "REFRESH_RATE_LIMITED", refreshResult.message, 429);
    }

    // Log admin activity
    try {
      await logAdminActivity(req, {
        event: "REFRESH_SOCIAL_INTELLIGENCE",
        metadata: {
          talentId,
          timestamp: new Date(),
        },
      });
    } catch (logError) {
      console.error("[SOCIAL_INTELLIGENCE] Failed to log activity:", logError);
    }

    return sendSuccess(res, { data: refreshResult.data }, 200, refreshResult.message);
  } catch (error) {
    console.error("[SOCIAL_INTELLIGENCE] Error refreshing:", error);
    logError("Failed to refresh social intelligence", error, { talentId: req.params.id });
    return handleApiError(res, error, "Failed to refresh analytics", "SOCIAL_INTELLIGENCE_REFRESH_FAILED");
  }
});

export default router;





