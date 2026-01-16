import express from "express";
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { logAdminActivity } from '../lib/adminActivityLogger.js';
import { logDestructiveAction, logAuditEvent } from '../lib/auditLogger.js';
import { logError } from '../lib/logger.js';
import { DealStage } from "@prisma/client";
import { isAdmin, isSuperAdmin } from '../lib/roleHelpers.js';
import * as dealWorkflowService from '../services/deals/dealWorkflowService.js';
import { enrichDealBrand } from '../lib/brandAutoCreation.js';
import { getEffectiveUserId, enforceDataScoping, blockAdminActionsWhileImpersonating } from '../lib/dataScopingHelpers.js';

const router = express.Router();

// All CRM routes require admin access
router.use(requireAuth);
router.use((req, res, next) => {
  if (!isAdmin(req.user!) && !isSuperAdmin(req.user!)) {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  next();
});

// GET /api/crm-deals/snapshot - Get aggregate snapshot of all deals
router.get("/snapshot", async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // SECURITY FIX: Scope to effective user to prevent accessing other talents' deals while impersonating
    const effectiveUserId = getEffectiveUserId(req);

    // Fetch talent to get currency preference
    const talent = await prisma.talent.findFirst({
      where: { userId: effectiveUserId },
      select: { currency: true },
    });

    // Fetch deals for effective user only
    const allDeals = await prisma.deal.findMany({
      where: {
        userId: effectiveUserId
      },
      select: {
        id: true,
        stage: true,
        value: true,
        currency: true,
        expectedClose: true,
        notes: true,
        brandName: true,
        brandId: true,
        userId: true,
        paymentStatus: true,
      },
    });

    // Calculate metrics
    const openPipeline = allDeals
      .filter(d => !["COMPLETED", "LOST", "DECLINED"].includes(d.stage || ""))
      .reduce((sum, d) => sum + (d.value || 0), 0);

    const confirmedRevenue = allDeals
      .filter(d => ["CONTRACT_SIGNED", "DELIVERABLES_IN_PROGRESS", "PAYMENT_PENDING"].includes(d.stage || ""))
      .reduce((sum, d) => sum + (d.value || 0), 0);

    const paid = allDeals
      .filter(d => ["PAYMENT_RECEIVED", "COMPLETED"].includes(d.stage || ""))
      .reduce((sum, d) => sum + (d.value || 0), 0);

    const outstanding = confirmedRevenue - paid;

    // Count deals needing attention
    const needsAttention = allDeals.filter(d => {
      if (!d.userId) return true;
      if (!d.stage) return true;
      if (!d.value || d.value === 0) return true;
      if (d.expectedClose && new Date(d.expectedClose) < now) return true;
      if (!d.brandName || !d.brandId) return true;
      return false;
    }).length;

    // Deals closing this month
    const closingThisMonth = allDeals.filter(d => {
      if (!d.expectedClose) return false;
      const closeDate = new Date(d.expectedClose);
      return closeDate >= monthStart && closeDate <= monthEnd;
    });

    const closingThisMonthCount = closingThisMonth.length;
    const closingThisMonthValue = closingThisMonth.reduce((sum, d) => sum + (d.value || 0), 0);

    // Response
    res.json({
      snapshot: {
        openPipeline,
        confirmedRevenue,
        paid,
        outstanding,
        needsAttentionCount: needsAttention,
        closingThisMonthCount,
        closingThisMonthValue,
      },
      meta: {
        totalDeals: allDeals.length,
        currency: talent?.currency || "GBP",
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[crmDeals] Snapshot error:", error);
    logError("Failed to fetch deals snapshot", error, { userId: req.user?.id });
    res.status(500).json({ 
      error: "Failed to fetch snapshot",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/crm-deals - List all deals with optional filters
router.get("/", async (req, res) => {
  try {
    const effectiveUserId = getEffectiveUserId(req);
    const { brandId, status, owner } = req.query;

    const where: any = {};
    // SECURITY FIX: Filter by effectiveUserId to prevent accessing other talents' deals while impersonating
    where.userId = effectiveUserId;
    
    if (brandId) where.brandId = brandId;
    if (status) {
      // Map status string to DealStage enum if needed
      const stageMap: Record<string, DealStage> = {
        "Prospect": DealStage.NEW_LEAD,
        "Negotiation": DealStage.NEGOTIATION,
        "Contract Sent": DealStage.CONTRACT_SENT,
        "Contract Signed": DealStage.CONTRACT_SIGNED,
        "In Progress": DealStage.DELIVERABLES_IN_PROGRESS,
        "Payment Pending": DealStage.PAYMENT_PENDING,
        "Payment Received": DealStage.PAYMENT_RECEIVED,
        "Completed": DealStage.COMPLETED,
        "Lost": DealStage.LOST,
      };
      where.stage = stageMap[status as string] || status;
    }
    if (owner) where.userId = owner;

    let deals = await prisma.deal.findMany({
      where,
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
          },
        },
        Talent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Auto-heal deals with missing brands
    // If a deal has brandName but no Brand object, attempt to find/create brand
    deals = await Promise.all(
      deals.map(deal => enrichDealBrand(deal))
    );

    // Transform deals to include dealName (from brandName) for backward compatibility
    const transformedDeals = deals.map(deal => ({
      ...deal,
      dealName: deal.brandName || `Deal with ${deal.Brand?.name || 'Unknown Brand'}`,
      status: deal.stage,
      estimatedValue: deal.value,
      expectedCloseDate: deal.expectedClose,
    }));

    // CRITICAL: Ensure we always return an array, never an empty string
    const safeDeals = Array.isArray(transformedDeals) ? transformedDeals : [];
    res.json(safeDeals);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch deals";
    logError("Failed to fetch deals", error, { userId: req.user?.id, route: req.path });
    // CRITICAL: Return empty array on error to prevent '.filter is not a function' crashes
    return res.status(500).json([]);
  }
});

// GET /api/crm-deals/:id - Get a single deal by ID
router.get("/:id", async (req, res) => {
  try {
    const effectiveUserId = getEffectiveUserId(req);
    const { id } = req.params;

    let deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
          },
        },
        Talent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }
    
    // SECURITY FIX: Enforce data scoping - only return deal if owned by effective user
    if (deal.userId !== effectiveUserId) {
      return res.status(403).json({ error: "Cannot access deals for other users while impersonating" });
    }

    // Auto-heal deal with missing brand
    deal = await enrichDealBrand(deal);

    // Transform deal to include dealName for backward compatibility
    const transformedDeal = {
      ...deal,
      dealName: deal.brandName || `Deal with ${deal.Brand?.name || 'Unknown Brand'}`,
      status: deal.stage,
      estimatedValue: deal.value,
      expectedCloseDate: deal.expectedClose,
    };

    res.json(transformedDeal);
  } catch (error) {
    logError("Failed to fetch deal", error, { dealId: req.params.id, userId: req.user?.id });
    if (error instanceof Error && error.message.includes("not found")) {
      return res.status(404).json({ error: "Deal not found" });
    }
    res.status(500).json({ 
      error: "Failed to fetch deal",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/crm-deals - Create a new deal
router.post("/", async (req, res) => {
  try {
    // Block admin actions while impersonating
    blockAdminActionsWhileImpersonating(req);
    
    // Get effective user ID (respects impersonation context)
    const effectiveUserId = getEffectiveUserId(req);
    
    const { dealName, brandId, status, estimatedValue, expectedCloseDate, notes, userId, talentId } = req.body;

    // Validation
    if (!dealName || !dealName.trim()) {
      return res.status(400).json({ error: "Deal name is required" });
    }
    if (!brandId) {
      return res.status(400).json({ error: "Brand is required" });
    }
    // SECURITY FIX: Use effectiveUserId instead of trusting talentId from body
    // This prevents admins from creating deals assigned to other talents while impersonating
    if (!talentId) {
      return res.status(400).json({ error: "Talent ID is required" });
    }
    // Enforce data scoping - if talentId doesn't match effective user, reject
    if (talentId !== effectiveUserId) {
      return res.status(403).json({ error: "Cannot create deals for other users while impersonating" });
    }
    // Ignore userId from body - always use effectiveUserId
    const finalUserId = effectiveUserId;

    // Map status string to DealStage enum
    const stageMap: Record<string, DealStage> = {
      "Prospect": DealStage.NEW_LEAD,
      "Negotiation": DealStage.NEGOTIATION,
      "Contract Sent": DealStage.CONTRACT_SENT,
      "Contract Signed": DealStage.CONTRACT_SIGNED,
      "In Progress": DealStage.DELIVERABLES_IN_PROGRESS,
      "Payment Pending": DealStage.PAYMENT_PENDING,
      "Payment Received": DealStage.PAYMENT_RECEIVED,
      "Completed": DealStage.COMPLETED,
      "Lost": DealStage.LOST,
    };
    const stage = status ? (stageMap[status] || DealStage.NEW_LEAD) : DealStage.NEW_LEAD;

    const deal = await prisma.deal.create({
      data: {
        id: `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        brandName: dealName.trim(), // Deal model uses brandName
        brandId,
        userId: finalUserId,
        talentId: effectiveUserId,
        stage,
        value: estimatedValue || null,
        expectedClose: expectedCloseDate ? new Date(expectedCloseDate) : null,
        notes: notes || null,
        updatedAt: new Date(),
      },
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
          },
        },
        Talent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log activity
    try {
      await Promise.all([
        logAdminActivity(req as any, {
          event: "CRM_DEAL_CREATED",
          metadata: { dealId: deal.id, dealName: deal.brandName, brandId: deal.brandId }
        }),
        logAuditEvent(req as any, {
          action: "DEAL_CREATED",
          entityType: "Deal",
          entityId: deal.id,
          metadata: { dealName: deal.brandName, brandId: deal.brandId, value: deal.value }
        })
      ]);
    } catch (logError) {
      console.error("Failed to log activity/audit:", logError);
    }

    // Transform response for backward compatibility
    const transformedDeal = {
      ...deal,
      dealName: deal.brandName,
      status: deal.stage,
      estimatedValue: deal.value,
      expectedCloseDate: deal.expectedClose,
    };

    res.status(201).json(transformedDeal);
  } catch (error) {
    console.error("[crmDeals] Error creating deal:", error);
    res.status(500).json({ 
      error: "Failed to create deal",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// PATCH /api/crm-deals/:id - Update a deal
router.patch("/:id", async (req, res) => {
  try {
    // Block admin actions while impersonating
    blockAdminActionsWhileImpersonating(req);
    
    const effectiveUserId = getEffectiveUserId(req);
    const { id } = req.params;
    const { dealName, brandId, status, stage, estimatedValue, value, currency, expectedCloseDate, expectedClose, notes, paymentStatus } = req.body;
    
    // Verify deal exists and is owned by effective user
    const existingDeal = await prisma.deal.findUnique({ where: { id } });
    if (!existingDeal) {
      return res.status(404).json({ error: "Deal not found" });
    }
    if (existingDeal.userId !== effectiveUserId) {
      return res.status(403).json({ error: "Cannot update deals for other users while impersonating" });
    }

    // If status is being changed, use workflow service to trigger invoice creation
    if (status !== undefined || stage !== undefined) {
      const stageMap: Record<string, DealStage> = {
        "Prospect": DealStage.NEW_LEAD,
        "Negotiation": DealStage.NEGOTIATION,
        "Contract Sent": DealStage.CONTRACT_SENT,
        "Contract Signed": DealStage.CONTRACT_SIGNED,
        "In Progress": DealStage.DELIVERABLES_IN_PROGRESS,
        "Payment Pending": DealStage.PAYMENT_PENDING,
        "Payment Received": DealStage.PAYMENT_RECEIVED,
        "Completed": DealStage.COMPLETED,
        "Lost": DealStage.LOST,
      };
      
      // Support both 'stage' (DealStage enum) and 'status' (mapped string)
      let newStage = stage;
      if (!newStage && status) {
        newStage = stageMap[status] || DealStage.NEW_LEAD;
      }
      
      let workflowResult: any = null;
      if (newStage) {
        // Use workflow service for stage changes to trigger invoice creation
        workflowResult = await dealWorkflowService.changeStage(id, newStage, req.user!.id);
        
        if (!workflowResult.success) {
          return res.status(workflowResult.status || 500).json({ 
            error: workflowResult.error || "Failed to update deal stage"
          });
        }
      }
      
      // Continue with other field updates if provided
      const updateData: any = { updatedAt: new Date() };
      if (dealName !== undefined) updateData.brandName = dealName.trim();
      if (brandId !== undefined) updateData.brandId = brandId;
      if (estimatedValue !== undefined) updateData.value = estimatedValue;
      if (value !== undefined) updateData.value = value;
      if (currency !== undefined) updateData.currency = currency;
      if (expectedCloseDate !== undefined) updateData.expectedClose = expectedCloseDate ? new Date(expectedCloseDate) : null;
      if (expectedClose !== undefined) updateData.expectedClose = expectedClose ? new Date(expectedClose) : null;
      if (notes !== undefined) updateData.notes = notes;
      
      // If other fields need updating, update them
      if (Object.keys(updateData).length > 1) { // More than just updatedAt
        const deal = await prisma.deal.update({
          where: { id },
          data: updateData,
          include: {
            Brand: {
              select: {
                id: true,
                name: true,
              },
            },
            Talent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
        
        // Log activity
        try {
          await Promise.all([
            logAdminActivity(req as any, {
              event: "CRM_DEAL_UPDATED",
              metadata: { dealId: deal.id, dealName: deal.brandName, changes: Object.keys(updateData) }
            }),
            logAuditEvent(req as any, {
              action: "DEAL_UPDATED",
              entityType: "Deal",
              entityId: deal.id,
              metadata: { dealName: deal.brandName, changes: Object.keys(updateData) }
            })
          ]);
        } catch (logError) {
          console.error("Failed to log activity/audit:", logError);
        }
        
        // Transform response
        const transformedDeal = {
          ...deal,
          dealName: deal.brandName,
          status: deal.stage,
          estimatedValue: deal.value,
          expectedCloseDate: deal.expectedClose,
        };
        
        return res.json(transformedDeal);
      } else {
        // Only stage was changed, return workflow result if it exists
        if (workflowResult) {
          const transformedDeal = {
            ...workflowResult.deal,
            dealName: workflowResult.deal.brandName,
            status: workflowResult.deal.stage,
            estimatedValue: workflowResult.deal.value,
            expectedCloseDate: workflowResult.deal.expectedClose,
          };
          return res.json(transformedDeal);
        } else {
          // Fetch the deal if no other updates
          const deal = await prisma.deal.findUnique({
            where: { id },
            include: {
              Brand: { select: { id: true, name: true } },
              Talent: { select: { id: true, name: true } },
            },
          });
          
          if (!deal) {
            return res.status(404).json({ error: "Deal not found" });
          }
          
          const transformedDeal = {
            ...deal,
            dealName: deal.brandName,
            status: deal.stage,
            estimatedValue: deal.value,
            expectedCloseDate: deal.expectedClose,
          };
          return res.json(transformedDeal);
        }
      }
    }
    
    // No status change - update other fields normally
    const updateData: any = {};
    if (dealName !== undefined) updateData.brandName = dealName.trim();
    if (brandId !== undefined) updateData.brandId = brandId;
    if (estimatedValue !== undefined) updateData.value = estimatedValue;
    if (value !== undefined) updateData.value = value;
    if (currency !== undefined) updateData.currency = currency;
    if (expectedCloseDate !== undefined) updateData.expectedClose = expectedCloseDate ? new Date(expectedCloseDate) : null;
    if (expectedClose !== undefined) updateData.expectedClose = expectedClose ? new Date(expectedClose) : null;
    if (notes !== undefined) updateData.notes = notes;
    updateData.updatedAt = new Date();

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const deal = await prisma.deal.update({
      where: { id },
      data: updateData,
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
          },
        },
        Talent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log activity
    try {
      await Promise.all([
        logAdminActivity(req as any, {
          event: "CRM_DEAL_UPDATED",
          metadata: { dealId: deal.id, dealName: deal.brandName, changes: Object.keys(updateData) }
        }),
        logAuditEvent(req as any, {
          action: "DEAL_UPDATED",
          entityType: "Deal",
          entityId: deal.id,
          metadata: { dealName: deal.brandName, changes: Object.keys(updateData) }
        })
      ]);
    } catch (logError) {
      console.error("Failed to log activity/audit:", logError);
    }

    // Transform response
    const transformedDeal = {
      ...deal,
      dealName: deal.brandName,
      status: deal.stage,
      estimatedValue: deal.value,
      expectedCloseDate: deal.expectedClose,
    };

    res.json(transformedDeal);
  } catch (error) {
    console.error("[crmDeals] Error updating deal:", error);
    logError("Failed to update deal", error, { dealId: req.params.id, userId: req.user?.id });
    res.status(500).json({ 
      error: "Failed to update deal",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// DELETE /api/crm-deals/:id - Delete a deal
router.delete("/:id", async (req, res) => {
  try {
    // Block admin actions while impersonating
    blockAdminActionsWhileImpersonating(req);
    
    const effectiveUserId = getEffectiveUserId(req);
    const { id } = req.params;

    const deal = await prisma.deal.findUnique({ 
      where: { id },
      select: { id: true, brandName: true, brandId: true, userId: true }
    });
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }
    
    // SECURITY FIX: Enforce data scoping - verify deal is owned by effective user before deleting
    if (deal.userId !== effectiveUserId) {
      return res.status(403).json({ error: "Cannot delete deals for other users while impersonating" });
    }

    await prisma.deal.delete({
      where: { id },
    });

    // Log destructive action
    try {
      await Promise.all([
        logDestructiveAction(req as any, {
          action: "DEAL_DELETED",
          entityType: "Deal",
          entityId: deal.id,
          metadata: { dealName: deal.brandName, brandId: deal.brandId }
        }),
        logAdminActivity(req as any, {
          event: "CRM_DEAL_DELETED",
          metadata: { dealId: deal.id, dealName: deal.brandName }
        })
      ]);
    } catch (logError) {
      console.error("Failed to log destructive action:", logError);
    }

    res.json({ success: true });
  } catch (error) {
    logError("Failed to delete deal", error, { dealId: req.params.id, userId: req.user?.id });
    res.status(500).json({ 
      error: "Failed to delete deal",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/crm-deals/:id/notes - Add a note to a deal
router.post("/:id/notes", async (req, res) => {
  try {
    const effectiveUserId = getEffectiveUserId(req);
    const { id } = req.params;
    const { text, author } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Note text is required" });
    }

    const deal = await prisma.deal.findUnique({
      where: { id },
    });

    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    // SECURITY FIX: Enforce data scoping - verify deal is owned by effective user
    if (deal.userId !== effectiveUserId) {
      return res.status(403).json({ error: "Cannot add notes to deals for other users while impersonating" });
    }

    // Deal.notes is a string, not an array - append to it
    const authorName = author || req.user?.email || req.user?.name || "unknown";
    const timestamp = new Date().toISOString();
    const newNote = `[${timestamp}] ${authorName}: ${text.trim()}`;
    const updatedNotes = deal.notes ? `${deal.notes}\n${newNote}` : newNote;

    const updatedDeal = await prisma.deal.update({
      where: { id },
      data: { notes: updatedNotes },
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
          },
        },
        Talent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Transform response
    const transformedDeal = {
      ...updatedDeal,
      dealName: updatedDeal.brandName,
      status: updatedDeal.stage,
      estimatedValue: updatedDeal.value,
      expectedCloseDate: updatedDeal.expectedClose,
    };

    res.json(transformedDeal);
  } catch (error) {
    console.error("[crmDeals] Error adding note:", error);
    res.status(500).json({ 
      error: "Failed to add note",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/crm-deals/batch-import - Import deals from localStorage
router.post("/batch-import", async (req, res) => {
  try {
    // Block admin actions while impersonating
    blockAdminActionsWhileImpersonating(req);
    
    const { deals } = req.body;

    if (!Array.isArray(deals) || deals.length === 0) {
      return res.status(400).json({ error: "Deals array is required" });
    }

    // SECURITY FIX: Get effective user and enforce data scoping
    const effectiveUserId = getEffectiveUserId(req);

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    const stageMap: Record<string, DealStage> = {
      "Prospect": DealStage.NEW_LEAD,
      "Negotiation": DealStage.NEGOTIATION,
      "Contract Sent": DealStage.CONTRACT_SENT,
      "Contract Signed": DealStage.CONTRACT_SIGNED,
      "In Progress": DealStage.DELIVERABLES_IN_PROGRESS,
      "Payment Pending": DealStage.PAYMENT_PENDING,
      "Payment Received": DealStage.PAYMENT_RECEIVED,
      "Completed": DealStage.COMPLETED,
      "Lost": DealStage.LOST,
    };

    for (const deal of deals) {
      try {
        // Skip if deal name or brand ID is missing
        if (!deal.dealName || !deal.brandId) {
          results.skipped++;
          results.errors.push(`Deal "${deal.dealName || 'unnamed'}" missing required fields`);
          continue;
        }

        // Check if brand exists
        const brandExists = await prisma.brand.findUnique({
          where: { id: deal.brandId },
        });

        if (!brandExists) {
          results.skipped++;
          results.errors.push(`Brand not found for deal "${deal.dealName}"`);
          continue;
        }

        // Require userId and talentId for Deal model
        if (!deal.userId || !deal.talentId) {
          results.skipped++;
          results.errors.push(`Deal "${deal.dealName}" missing userId or talentId`);
          continue;
        }

        // SECURITY FIX: Enforce data scoping - only allow importing deals for effective user
        if (deal.userId !== effectiveUserId || deal.talentId !== effectiveUserId) {
          results.skipped++;
          results.errors.push(`Cannot import deals for other users while impersonating`);
          continue;
        }

        await prisma.deal.create({
          data: {
            id: `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            brandName: deal.dealName,
            brandId: deal.brandId,
            userId: effectiveUserId,
            talentId: effectiveUserId,
            stage: deal.status ? (stageMap[deal.status] || DealStage.NEW_LEAD) : DealStage.NEW_LEAD,
            value: deal.estimatedValue || null,
            expectedClose: deal.expectedCloseDate ? new Date(deal.expectedCloseDate) : null,
            notes: deal.notes || null,
            updatedAt: new Date(),
          },
        });

        results.imported++;
      } catch (error: any) {
        results.skipped++;
        results.errors.push(`Failed to import deal "${deal.dealName}": ${error.message}`);
      }
    }

    res.json(results);
  } catch (error) {
    console.error("[crmDeals] Error importing deals:", error);
    res.status(500).json({ 
      error: "Failed to import deals",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/crm-deals/admin/heal-missing-brands - Heal all deals with missing brands
// SUPERADMIN ONLY: Scans all deals and auto-creates brands where needed
router.post("/admin/heal-missing-brands", async (req, res) => {
  try {
    // Block admin actions while impersonating
    blockAdminActionsWhileImpersonating(req);
    
    // Check SUPERADMIN authorization
    if (!isSuperAdmin(req.user!)) {
      return res.status(403).json({ error: "FORBIDDEN: Only SUPERADMIN can trigger batch healing" });
    }

    console.log(`[crmDeals] SUPERADMIN ${req.user?.email} triggered brand healing operation`);

    // Import here to avoid circular dependency
    const { healMissingBrands } = await import("../lib/brandAutoCreation.js");

    const result = await healMissingBrands();

    // Log the action
    await logAdminActivity(req as any, {
      event: "BATCH_BRAND_HEALING",
      metadata: {
        healed: result.healed,
        failed: result.failed,
        totalChecked: result.totalChecked,
        hasErrors: result.errors.length > 0,
      }
    });

    res.json({
      success: true,
      message: `Healed ${result.healed} deals with missing brands`,
      details: result,
    });
  } catch (error) {
    console.error("[crmDeals] Error in heal-missing-brands:", error);
    logError("Failed to heal missing brands", error, { userId: req.user?.id });
    res.status(500).json({
      error: "Failed to heal missing brands",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});


export default router;
