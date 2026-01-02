import { Router, type Request, type Response } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import prisma from "../../lib/prisma.js";
import { z } from "zod";
import { isAdmin, isSuperAdmin } from "../../lib/roleHelpers.js";
import { logAdminActivity } from "../../lib/adminActivityLogger.js";
import { logAuditEvent } from "../../lib/auditLogger.js";
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
    const talents = await prisma.talent.findMany({
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
        Deal: {
          where: {
            stage: {
              notIn: ["COMPLETED", "LOST"],
            },
          },
          select: {
            id: true,
            stage: true,
          },
        },
        _count: {
          select: {
            Deal: true,
            CreatorTask: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Use createdAt instead of name to avoid schema issues
      },
    });

    // Calculate metrics for each talent with error handling
    const talentsWithMetrics = await Promise.all(
      talents.map(async (talent) => {
        try {
          // Count open opportunities (if Opportunity model has talentId)
          const openOpportunities = 0; // TODO: Add when Opportunity model is updated

          // Count active deals
          const activeDeals = talent.Deal?.length || 0;

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

          return {
            id: talent.id,
            name: talent.name || "Unknown",
            displayName: talent.name || "Unknown",
            representationType: "NON_EXCLUSIVE", // Default for now, will be added in schema migration
            status: "ACTIVE", // Default for now
            linkedUser: talent.User
              ? {
                  id: talent.User.id,
                  email: talent.User.email,
                  name: talent.User.name,
                  avatarUrl: talent.User.avatarUrl,
                }
              : null,
            managerId: null, // Will be added in schema migration
            metrics: {
              openOpportunities,
              activeDeals,
              totalDeals: talent._count?.Deal || 0,
              totalTasks: talent._count?.CreatorTask || 0,
              totalRevenue,
            },
            createdAt: talent.createdAt,
            updatedAt: talent.updatedAt,
          };
        } catch (talentError) {
          // If individual talent processing fails, return minimal data
          logError("Failed to process talent metrics", talentError, { talentId: talent.id });
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
            createdAt: talent.createdAt,
            updatedAt: talent.updatedAt,
          };
        }
      })
    );

    sendList(res, talentsWithMetrics || []);
  } catch (error) {
    logError("Failed to fetch talent list", error, { userId: req.user?.id });
    // Return empty list on error - graceful degradation
    sendEmptyList(res);
  }
});

/**
 * GET /api/admin/talent/:id
 * Get single talent with full details
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

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
        Deal: {
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
        },
        CreatorTask: {
          orderBy: {
            dueDate: "desc",
          },
          take: 20,
        },
        Payment: {
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
        },
        Payout: {
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
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
      return res.status(404).json({ error: "Talent not found" });
    }

    // Calculate snapshot metrics
    const activeDeals = talent.Deal.filter((d) => d.stage !== "COMPLETED" && d.stage !== "LOST").length;
    const totalRevenue = talent.Payment.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPayouts = talent.Payout.reduce((sum, p) => sum + (p.amount || 0), 0);

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
      deals: talent.Deal.map((deal) => ({
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
      tasks: talent.CreatorTask.slice(0, 10).map((task) => ({
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
        payments: talent.Payment.slice(0, 10),
        payoutsList: talent.Payout.slice(0, 10),
      },
      createdAt: talent.createdAt,
      updatedAt: talent.updatedAt,
    };

    sendSuccess(res, { talent: talentData });
  } catch (error) {
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
        createdAt: talent.createdAt,
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
        updatedAt: updatedTalent.updatedAt,
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

export default router;

