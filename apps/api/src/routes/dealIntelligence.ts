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
 * Generate or regenerate intelligence for a deal (admin only)
 */
router.post("/run/:dealId", requireRole(['ADMIN', 'SUPERADMIN']), async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;

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

    // Generate intelligence summary
    const summary = `Deal: ${deal.dealName || 'Unnamed'}\nBrand: ${deal.Brand?.name || 'Unknown'}\nStatus: ${deal.status || 'Unknown'}\nValue: ${deal.estimatedValue || 'Not set'}`;

    // Analyze risk flags
    const riskFlags: string[] = [];
    if (deal.expectedCloseDate && new Date(deal.expectedCloseDate) < new Date()) {
      riskFlags.push("Expected close date has passed");
    }
    if (deal.confidence === "Low") {
      riskFlags.push("Low confidence deal");
    }
    if (!deal.estimatedValue || deal.estimatedValue === 0) {
      riskFlags.push("No estimated value set");
    }

    // Performance notes
    const performanceNotes: string[] = [];
    if (deal.status === "Closed Won") {
      performanceNotes.push("Deal successfully closed");
    } else if (deal.status === "Closed Lost") {
      performanceNotes.push("Deal was lost");
    }

    // Upsert intelligence
    const intelligence = await prisma.dealIntelligence.upsert({
      where: { dealId },
      create: {
        id: `intel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dealId,
        summary,
        riskFlags,
        performanceNotes,
        insights: {
          dealName: deal.dealName,
          brandName: deal.Brand?.name,
          status: deal.status,
          estimatedValue: deal.estimatedValue
        }
      },
      update: {
        summary,
        riskFlags,
        performanceNotes,
        insights: {
          dealName: deal.dealName,
          brandName: deal.Brand?.name,
          status: deal.status,
          estimatedValue: deal.estimatedValue
        },
        updatedAt: new Date()
      }
    });

    // Audit log
    try {
      await logAuditEvent(req as any, {
        action: "DEAL_INTELLIGENCE_GENERATED",
        entityType: "DealIntelligence",
        entityId: intelligence.id,
        metadata: { dealId }
      });
    } catch (logError) {
      console.error("Failed to log audit event:", logError);
    }

    res.json({ intelligence });
  } catch (error) {
    logError("Failed to generate deal intelligence", error, { dealId: req.params.dealId });
    res.status(500).json({ 
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

    // Verify deal exists
    const deal = await prisma.deal.findUnique({
      where: { id: dealId }
    });

    if (!deal) {
      return res.status(404).json({ 
        error: "Deal not found" 
      });
    }

    const intelligence = await prisma.dealIntelligence.findUnique({
      where: { dealId }
    });

    if (!intelligence) {
      return res.status(404).json({ 
        error: "Intelligence not found for this deal",
        message: "Run /api/deals/intelligence/run/:dealId to generate intelligence"
      });
    }

    res.json({ intelligence });
  } catch (error) {
    logError("Failed to fetch deal intelligence", error, { dealId: req.params.dealId });
    res.status(500).json({ 
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
      ? `Following up on ${deal.dealName || 'our conversation'}`
      : `Regarding ${deal.dealName || 'your inquiry'}`;

    const body = `Dear ${recipient || 'Valued Partner'},

I wanted to reach out regarding ${deal.dealName || 'our opportunity'}.

${purpose === "follow-up" ? "I wanted to follow up on our previous conversation and see if you have any questions." : "I believe this could be a great fit for your needs."}

Deal Details:
- Deal: ${deal.dealName || 'N/A'}
- Brand: ${deal.Brand?.name || 'N/A'}
- Status: ${deal.status || 'N/A'}
${deal.estimatedValue ? `- Estimated Value: ${deal.estimatedValue}` : ''}

Please let me know if you'd like to discuss further.

Best regards`;

    res.json({ 
      subject,
      body,
      dealId,
      recipient: recipient || null
    });
  } catch (error) {
    logError("Failed to generate draft email", error, { dealId: req.params.dealId });
    res.status(500).json({ 
      error: "Failed to generate draft email",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
