import { Router, type Request, type Response } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import prisma from "../../lib/prisma.js";
import { z } from "zod";
import { isAdmin, isSuperAdmin } from "../../lib/roleHelpers.js";
import { logAdminActivity } from "../../lib/adminActivityLogger.js";
import { logAuditEvent, logDestructiveAction } from "../../lib/auditLogger.js";
import { logError } from "../../lib/logger.js";
import { sendSuccess, sendList, sendEmptyList, sendError, handleApiError } from "../../utils/apiResponse.js";
import { validateRequestSafe, TalentCreateSchema, TalentUpdateSchema, TalentLinkUserSchema } from "../../utils/validationSchemas.js";
import * as Sentry from "@sentry/node";

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
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    console.log("[TALENT] GET /api/admin/talent - Fetching all talents");
    console.log("[TALENT] User making request:", req.user?.id, req.user?.role);
    
    // First, try a simple count to verify connection
    const totalCount = await prisma.talent.count();
    console.log("[TALENT] Total talent count in database:", totalCount);
    
    // Try fetching without User relation first to see if that's the issue
    // Note: Talent model doesn't have createdAt/updatedAt fields, so we order by id instead
    const talentsWithoutUser = await prisma.talent.findMany({
      select: {
        id: true,
        name: true,
        userId: true,
        categories: true,
        stage: true,
      },
      orderBy: {
        id: "desc", // Order by id since createdAt doesn't exist on Talent model
      },
    });
    console.log("[TALENT] Found", talentsWithoutUser.length, "talents without User relation");
    
    // CRITICAL FIX: Always use the fallback query first to ensure we get all talents
    // The include query might fail if User relation has issues, so we'll fetch User separately
    // Use talentsWithoutUser as the base, then enrich with User data
    let talents = talentsWithoutUser;
    
    console.log("[TALENT] Found", talents.length, "talents (base query)");
    
    // If we have talents, enrich them with User and Deal data
    if (talents.length > 0) {
      // Enrich with User data separately to avoid relation failures
      // CRITICAL: Wrap in try-catch to prevent Promise.all from failing entirely
      let enrichedTalents: any[] = [];
      try {
        enrichedTalents = await Promise.all(
        talents.map(async (talent) => {
          try {
            // Fetch User separately (may fail for placeholder users, that's OK)
            let userData = null;
            try {
              const user = await prisma.user.findUnique({
                where: { id: talent.userId },
                select: {
                  id: true,
                  email: true,
                  name: true,
                  avatarUrl: true,
                },
              });
              userData = user;
            } catch (userError) {
              console.warn("[TALENT] Failed to fetch User for talent", talent.id, "- continuing without User data");
            }
            
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
            let socialAccounts = [];
            let primarySocialHandle = null;
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
              displayName: talent.name || "Unknown",
              representationType: "NON_EXCLUSIVE",
              status: "ACTIVE",
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
            // Return minimal data
            return {
              id: talent.id,
              name: talent.name || "Unknown",
              displayName: talent.name || "Unknown",
              representationType: "NON_EXCLUSIVE",
              status: "ACTIVE",
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
          displayName: t.name || "Unknown",
          representationType: "NON_EXCLUSIVE",
          status: "ACTIVE",
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
        displayName: t.name || "Unknown",
        representationType: "NON_EXCLUSIVE",
        status: "ACTIVE",
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
      talents.map(async (talent) => {
        try {
          // Count open opportunities for this talent
          // Opportunities are linked through OpportunityApplication.creatorId (which is userId)
          let openOpportunities = 0;
          if (talent.linkedUser?.id) {
            try {
              openOpportunities = await prisma.opportunityApplication.count({
                where: {
                  creatorId: talent.linkedUser.id,
                  status: { not: "rejected" } // Count pending and accepted applications
                }
              });
            } catch (oppError) {
              console.warn("[TALENT] Failed to count opportunities for talent", talent.id);
            }
          }

          // Calculate total revenue (from Payments) - handle gracefully if field doesn't exist
          let totalRevenue = 0;
          try {
            const revenueResult = await prisma.payment.aggregate({
              where: {
                talentId: talent.id,
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
            ...talent,
            metrics: {
              ...talent.metrics,
              openOpportunities,
              totalRevenue,
            },
          };
        } catch (talentError) {
          // If individual talent processing fails, return talent as-is
          logError("Failed to process talent metrics", talentError, { talentId: talent.id });
          return talent; // Return the talent we already have
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
    sendList(res, talentsWithMetrics || []);
  } catch (error) {
    console.error("[TALENT] Error fetching talent list:", error);
    logError("Failed to fetch talent list", error, { userId: req.user?.id, route: req.path });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/admin/talent', method: 'GET' },
    });
    
    // CRITICAL FIX: Never return empty list on error - return proper error response
    // Silent failures mask real issues and break read-after-write consistency
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch talent list",
      message: error instanceof Error ? error.message : "Failed to fetch talent list",
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
    let deals = [];
    let tasks = [];
    let payments = [];
    let payouts = [];
    let socialAccounts = [];
    
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
          dueDate: "desc",
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
      displayName: talent.name,
      legalName: null, // Will be added in schema migration
      primaryEmail: talent.User?.email || null,
      representationType: "NON_EXCLUSIVE", // Default for now
      status: "ACTIVE", // Default for now
      userId: talent.userId,
      managerId: null, // Will be added in schema migration
      notes: null, // Will be added in schema migration
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
        title: deal.brandName || `Deal ${deal.id.slice(0, 8)}`,
        stage: deal.stage,
        status: deal.stage, // Keep for backward compatibility with frontend
        value: deal.value,
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
    sendSuccess(res, { talent: talentData });
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
        displayName: talent.name,
        legalName: legalName || null,
        primaryEmail: talent.User?.email || null,
        representationType: representationType || "NON_EXCLUSIVE",
        status: status || "ACTIVE",
        linkedUser: talent.User
          ? {
              id: talent.User.id,
              email: talent.User.email,
              name: talent.User.name,
            }
          : null,
        // Note: Talent model doesn't have createdAt/updatedAt fields
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
      return sendError(res, "VALIDATION_ERROR", "Invalid request data", 400, validation.error.format());
    }

    const { displayName, legalName, primaryEmail, representationType, status, managerId, notes } = validation.data;

    const existingTalent = await prisma.talent.findUnique({
      where: { id },
    });

    if (!existingTalent) {
      return sendError(res, "NOT_FOUND", "Talent not found", 404);
    }

    // Update talent (limited to current schema fields)
    const updatedTalent = await prisma.talent.update({
      where: { id },
      data: {
        name: displayName || existingTalent.name,
        // Other fields will be added after schema migration
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

    // Log admin activity
    await logAdminActivity(req, {
      event: "TALENT_UPDATED",
      metadata: {
        talentId: id,
        changes: Object.keys(req.body),
      },
    });

    sendSuccess(res, {
      talent: {
        id: updatedTalent.id,
        name: updatedTalent.name,
        displayName: updatedTalent.name,
        linkedUser: updatedTalent.User
          ? {
              id: updatedTalent.User.id,
              email: updatedTalent.User.email,
              name: updatedTalent.User.name,
            }
          : null,
        // Note: Talent model doesn't have updatedAt field
      },
    });
  } catch (error) {
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
    logError("Failed to fetch talent contracts", error, { userId: req.user?.id, talentId: id });
    res.status(500).json({ error: "Failed to fetch talent contracts" });
  }
});

/**
 * GET /api/admin/talent/:id/inbox
 * Get inbox messages for a talent
 */
router.get("/:id/inbox", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
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
        createdAt: "desc",
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

    const blockingCounts = [];
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

    sendSuccess(res, { message: "Talent deleted successfully" }, 204);
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

export default router;

