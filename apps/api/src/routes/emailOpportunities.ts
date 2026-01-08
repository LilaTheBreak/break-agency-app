import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import { classifyEmailOpportunity } from "../services/emailClassifier.js";
import { fetchGmailMessages } from "../services/gmailService.js";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/email-opportunities/scan
 * Scans user's Gmail inbox for creator opportunities
 */
router.get("/scan", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if user has Gmail connected
    const gmailToken = await prisma.gmailToken.findUnique({
      where: { userId }
    });

    if (!gmailToken || !gmailToken.accessToken) {
      return res.status(400).json({ 
        error: "Gmail not connected",
        message: "Please connect your Gmail account first" 
      });
    }

    // Fetch recent emails (last 30 days)
    const days = parseInt(req.query.days as string) || 30;
    const limit = parseInt(req.query.limit as string) || 100;
    
    const messages = await fetchGmailMessages(
      gmailToken.accessToken,
      gmailToken.refreshToken,
      days,
      limit
    );

    // Classify each email
    const opportunities = [];
    for (const message of messages) {
      const classification = await classifyEmailOpportunity(message);
      
      if (classification.isOpportunity && classification.confidence > 0.6) {
        // Save to database
        const opportunity = await prisma.emailOpportunity.create({
          data: {
            id: `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            gmailMessageId: message.id,
            threadId: message.threadId,
            subject: message.subject,
            from: message.from,
            receivedAt: message.receivedAt,
            category: classification.category,
            confidence: classification.confidence,
            brandName: classification.details.brandName,
            opportunityType: classification.details.opportunityType,
            deliverables: classification.details.deliverables,
            dates: classification.details.dates,
            location: classification.details.location,
            paymentDetails: classification.details.paymentDetails,
            contactEmail: classification.details.contactEmail,
            isUrgent: classification.isUrgent,
            status: "NEW",
            emailBody: message.body,
            suggestedActions: classification.suggestedActions,
            updatedAt: new Date(),
          }
        });
        
        opportunities.push(opportunity);
      }
    }

    res.json({
      success: true,
      scanned: messages.length,
      opportunities: opportunities.length,
      results: opportunities
    });
  } catch (error) {
    console.error("Email scan error:", error);
    res.status(500).json({ error: "Failed to scan emails" });
  }
});

/**
 * GET /api/email-opportunities
 * Get all detected opportunities for user
 */
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const status = req.query.status as string;
    const category = req.query.category as string;

    const where: any = { userId };
    if (status) where.status = status;
    if (category) where.category = category;

    const opportunities = await prisma.emailOpportunity.findMany({
      where,
      orderBy: [
        { isUrgent: "desc" },
        { receivedAt: "desc" }
      ]
    });

    res.json({ opportunities });
  } catch (error) {
    console.error("Fetch opportunities error:", error);
    res.status(500).json({ error: "Failed to fetch opportunities" });
  }
});

/**
 * GET /api/email-opportunities/:id
 * Get single opportunity details
 */
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const opportunity = await prisma.emailOpportunity.findFirst({
      where: { id, userId }
    });

    if (!opportunity) {
      return res.status(404).json({ error: "Opportunity not found" });
    }

    res.json({ opportunity });
  } catch (error) {
    console.error("Fetch opportunity error:", error);
    res.status(500).json({ error: "Failed to fetch opportunity" });
  }
});

/**
 * PUT /api/email-opportunities/:id
 * Update opportunity status or details
 */
router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { status, notes, isRelevant } = req.body;

    const opportunity = await prisma.emailOpportunity.findFirst({
      where: { id, userId }
    });

    if (!opportunity) {
      return res.status(404).json({ error: "Opportunity not found" });
    }

    // Update opportunity
    const updated = await prisma.emailOpportunity.update({
      where: { id },
      data: {
        status,
        notes,
        isRelevant,
        updatedAt: new Date()
      }
    });

    // If user marked relevance, log for ML training
    if (typeof isRelevant === "boolean") {
      await prisma.emailFeedback.create({
        data: {
          id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          emailOpportunityId: id,
          isRelevant,
          category: opportunity.category,
          confidence: opportunity.confidence
        }
      });
    }

    res.json({ success: true, opportunity: updated });
  } catch (error) {
    console.error("Update opportunity error:", error);
    res.status(500).json({ error: "Failed to update opportunity" });
  }
});

/**
 * POST /api/email-opportunities/:id/actions
 * Take action on opportunity (reply, decline, etc.)
 */
router.post("/:id/actions", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { action, responseText } = req.body;

    const opportunity = await prisma.emailOpportunity.findFirst({
      where: { id, userId }
    });

    if (!opportunity) {
      return res.status(404).json({ error: "Opportunity not found" });
    }

    // Update status based on action
    const statusMap: Record<string, string> = {
      reply: "REPLIED",
      decline: "DECLINED",
      negotiate: "NEGOTIATING",
      request_brief: "AWAITING_BRIEF",
      archive: "ARCHIVED"
    };

    await prisma.emailOpportunity.update({
      where: { id },
      data: {
        status: statusMap[action] || "IN_PROGRESS",
        lastActionAt: new Date(),
        lastActionType: action,
        responseNotes: responseText
      }
    });

    res.json({ success: true, action });
  } catch (error) {
    console.error("Action error:", error);
    res.status(500).json({ error: "Failed to take action" });
  }
});

/**
 * GET /api/email-opportunities/stats
 * Get opportunity statistics
 */
router.get("/stats/summary", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const [total, byCategory, byStatus, urgent] = await Promise.all([
      prisma.emailOpportunity.count({ where: { userId } }),
      prisma.emailOpportunity.groupBy({
        by: ["category"],
        where: { userId },
        _count: true
      }),
      prisma.emailOpportunity.groupBy({
        by: ["status"],
        where: { userId },
        _count: true
      }),
      prisma.emailOpportunity.count({ 
        where: { userId, isUrgent: true, status: "NEW" } 
      })
    ]);

    res.json({
      total,
      urgent,
      byCategory: byCategory.reduce((acc, item) => {
        acc[item.category] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>)
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
