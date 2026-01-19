import { Router, type Request, type Response } from 'express';
import prisma from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

// ============================================================================
// BRAND FEEDBACK ENDPOINT (PART 3)
// ============================================================================

/**
 * POST /api/brand/campaigns/:campaignId/feedback
 * 
 * Brand user submits feedback, concerns, or preferences
 * Requires: BRAND role, campaign belongs to brand
 * 
 * Body:
 * {
 *   feedbackType: "APPROVAL" | "REJECTION" | "CONCERN" | "PREFERENCE"
 *   content: string
 *   relatedShortlistId?: string (if about specific creator)
 *   signals?: string[] (for AI learning)
 * }
 */
router.post('/:campaignId/feedback', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { campaignId } = req.params;
    const { feedbackType, content, relatedShortlistId, signals } = req.body;

    if (user?.role !== 'BRAND') {
      return res.status(403).json({ 
        error: 'Only brand users can submit feedback.' 
      });
    }

    if (!feedbackType || !content) {
      return res.status(400).json({ 
        error: 'feedbackType and content are required' 
      });
    }

    const brandUser = await prisma.brandUser.findFirst({
      where: { userId: user.id }
    });

    if (!brandUser) {
      return res.status(403).json({ 
        error: 'You are not linked to any brand.' 
      });
    }

    // Verify campaign belongs to brand
    const campaign = await prisma.crmCampaign.findFirst({
      where: {
        id: campaignId,
        brandId: brandUser.brandId,
        submissionSource: 'BRAND_PORTAL'
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Create feedback record
    const feedback = await prisma.campaignFeedback.create({
      data: {
        campaignId,
        shortlistId: relatedShortlistId || null,
        feedbackType,
        content,
        signals: signals || [],
        submittedByUserId: user.id
      }
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        userRole: 'BRAND',
        action: 'BRAND_FEEDBACK_SUBMITTED',
        entityType: 'CampaignFeedback',
        entityId: feedback.id,
        metadata: {
          campaignId,
          feedbackType,
          signals
        }
      }
    });

    res.status(201).json({
      feedbackId: feedback.id,
      message: 'Feedback submitted successfully',
      timestamp: feedback.submittedAt
    });

  } catch (error) {
    console.error('[FEEDBACK] Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

/**
 * GET /api/brand/campaigns/:campaignId/feedback
 * 
 * Brand views all feedback they've submitted for a campaign
 */
router.get('/:campaignId/feedback', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { campaignId } = req.params;

    if (user?.role !== 'BRAND') {
      return res.status(403).json({ 
        error: 'Only brand users can view feedback.' 
      });
    }

    const brandUser = await prisma.brandUser.findFirst({
      where: { userId: user.id }
    });

    if (!brandUser) {
      return res.status(403).json({ 
        error: 'You are not linked to any brand.' 
      });
    }

    const campaign = await prisma.crmCampaign.findFirst({
      where: {
        id: campaignId,
        brandId: brandUser.brandId,
        submissionSource: 'BRAND_PORTAL'
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const feedback = await prisma.campaignFeedback.findMany({
      where: {
        campaignId,
        submittedByUserId: user.id
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({ feedback, count: feedback.length });

  } catch (error) {
    console.error('[FEEDBACK] Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// ============================================================================
// ADMIN FEEDBACK REVIEW (PART 3)
// ============================================================================

/**
 * GET /api/admin/campaigns/:campaignId/feedback
 * 
 * Admin views all feedback from brands for a campaign
 * Includes: feedback type, content, signals for AI learning
 */
router.get('/:campaignId/feedback', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { campaignId } = req.params;

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
      return res.status(403).json({ 
        error: 'Only admins can view campaign feedback.' 
      });
    }

    // Verify campaign exists
    const campaign = await prisma.crmCampaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const feedback = await prisma.campaignFeedback.findMany({
      where: { campaignId },
      include: {
        SubmittedBy: {
          select: { id: true, email: true, name: true }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({ 
      campaign: { id: campaign.id, campaignName: campaign.campaignName },
      feedback,
      count: feedback.length,
      signals: aggregateSignals(feedback)
    });

  } catch (error) {
    console.error('[FEEDBACK] Error fetching admin feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

/**
 * Helper: Aggregate learning signals from all feedback
 */
function aggregateSignals(feedbackList: any[]): Record<string, number> {
  const signalCounts: Record<string, number> = {};
  
  feedbackList.forEach(fb => {
    if (fb.signals && Array.isArray(fb.signals)) {
      fb.signals.forEach((signal: string) => {
        signalCounts[signal] = (signalCounts[signal] || 0) + 1;
      });
    }
  });

  return signalCounts;
}

export default router;
