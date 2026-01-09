import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import prisma from "../lib/prisma.js";
import { logError } from "../lib/logger.js";
import { logAuditEvent } from "../lib/auditLogger.js";

const router = Router();

// Phase 5: Feature flag check
const checkDealIntelligenceEnabled = (req: Request, res: Response, next: Function) => {
  const enabled = process.env.DEAL_INTELLIGENCE_ENABLED === "true";
  if (!enabled) {
    return res.status(503).json({
      error: "Deal intelligence feature is disabled",
      message: "This feature is currently disabled. Contact an administrator to enable it.",
      code: "FEATURE_DISABLED"
    });
  }
  next();
};

router.use(requireAuth, checkDealIntelligenceEnabled);

/**
 * POST /api/deals/intelligence/run/:dealId
 * Generate or regenerate AI-powered intelligence for a deal
 */
router.post("/run/:dealId", async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const userId = (req as any).user?.id;

    // Verify deal exists and user has access
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        Brand: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!deal) {
      return res.status(404).json({ 
        error: "Deal not found" 
      });
    }

    // Check user access (deal owner or admin)
    if (deal.userId !== userId && !(req as any).user?.role?.includes("ADMIN")) {
      return res.status(403).json({ 
        error: "Access denied" 
      });
    }

    // Generate AI intelligence
    const { generateDealIntelligence, saveDealIntelligence } = await import("../services/dealIntelligenceService.js");
    const intelligence = await generateDealIntelligence(dealId);
    const saved = await saveDealIntelligence(dealId, intelligence);

    // Audit log
    try {
      await logAuditEvent(req as any, {
        action: "DEAL_INTELLIGENCE_GENERATED",
        entityType: "DealIntelligence",
        entityId: saved.id,
        metadata: { dealId }
      });
    } catch (logError) {
      console.error("Failed to log audit event:", logError);
    }

    return res.json({ 
      success: true,
      intelligence: {
        ...intelligence,
        id: saved.id,
        generatedAt: saved.generatedAt
      }
    });
  } catch (error) {
    logError("Failed to generate deal intelligence", error, { dealId: req.params.dealId });
    return res.status(500).json({ 
      error: "Failed to generate intelligence",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/deals/intelligence/:dealId
 * Get intelligence for a deal
 */
router.get("/:dealId", async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const userId = (req as any).user?.id;

    // Verify deal exists and user has access
    const deal = await prisma.deal.findUnique({
      where: { id: dealId }
    });

    if (!deal) {
      return res.status(404).json({ 
        error: "Deal not found" 
      });
    }

    // Check user access
    if (deal.userId !== userId && !(req as any).user?.role?.includes("ADMIN")) {
      return res.status(403).json({ 
        error: "Access denied" 
      });
    }

    const intelligence = await prisma.dealIntelligence.findUnique({
      where: { dealId }
    });

    if (!intelligence) {
      return res.status(404).json({ 
        error: "Intelligence not found for this deal",
        message: "Run POST /api/deals/intelligence/run/:dealId to generate intelligence"
      });
    }

    // Return structured intelligence
    const insights = intelligence.insights as any;
    return res.json({ 
      success: true,
      intelligence: {
        id: intelligence.id,
        dealId: intelligence.dealId,
        suggestedValueRange: insights?.suggestedValueRange || null,
        confidenceScore: insights?.confidenceScore || 0,
        explanation: intelligence.summary || insights?.explanation || "",
        reasoning: insights?.reasoning || {},
        riskFlags: intelligence.riskFlags || [],
        generatedAt: intelligence.generatedAt,
        updatedAt: intelligence.updatedAt
      }
    });
  } catch (error) {
    logError("Failed to fetch deal intelligence", error, { dealId: req.params.dealId });
    return res.status(500).json({ 
      error: "Failed to fetch intelligence",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/deals/:dealId/draft-email
 * Generate draft email for deal (admin only)
 */
router.post("/:dealId/draft-email", requireRole(['ADMIN', 'SUPERADMIN']), async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const { recipient, purpose } = req.body;

    // Verify deal exists
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        Brand: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!deal) {
      return res.status(404).json({ 
        error: "Deal not found" 
      });
    }

    // Generate draft email content
    const subject = purpose === "follow-up" 
      ? `Following up on ${deal.brandName || 'our conversation'}`
      : `Regarding ${deal.brandName || 'your inquiry'}`;

    const body = `Dear ${recipient || 'Valued Partner'},

I wanted to reach out regarding ${deal.brandName || 'our opportunity'}.

${purpose === "follow-up" ? "I wanted to follow up on our previous conversation and see if you have any questions." : "I believe this could be a great fit for your needs."}

Deal Details:
- Deal: ${deal.brandName || 'N/A'}
- Brand: ${deal.Brand?.name || 'N/A'}
- Status: ${(deal as any).stage || 'N/A'}
${(deal as any).value ? `- Estimated Value: ${(deal as any).value}` : ''}

Please let me know if you'd like to discuss further.

Best regards`;

    return res.json({ 
      subject,
      body,
      dealId,
      recipient: recipient || null
    });
  } catch (error) {
    logError("Failed to generate draft email", error, { dealId: req.params.dealId });
    return res.status(500).json({ 
      error: "Failed to generate draft email",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
