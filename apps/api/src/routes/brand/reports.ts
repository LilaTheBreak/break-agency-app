import { Router, type Request, type Response } from 'express';
import prisma from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

// ============================================================================
// PART 4: BRAND REPORT VIEWING
// Mounted at /api/brand/reports/:campaignId
// ============================================================================

/**
 * GET /api/brand/reports/:campaignId
 * 
 * Brand views approved campaign report
 * Only shows: executive summary, metrics, recommendations
 * Hides: internal notes, admin decisions, cost info
 */
router.get('/:campaignId', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { campaignId } = req.params;

    if (user?.role !== 'BRAND') {
      return res.status(403).json({ 
        error: 'Only brand users can view their reports.' 
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

    // Get approved report only
    const report = await prisma.campaignReport.findUnique({
      where: { campaignId }
    });

    if (!report || (report as any).status !== 'APPROVED') {
      return res.status(404).json({ 
        error: 'Report not available yet. Check back after campaign completion.' 
      });
    }

    // Brand-safe report content (hides admin notes, internal decisions)
    const brandSafeReport = {
      campaignId,
      campaignName: campaign.campaignName,
      generatedAt: report.generatedAt,
      releasedAt: report.releasedAt,
      report: {
        executiveSummary: (report.reportContent as any)?.executiveSummary,
        campaignObjective: (report.reportContent as any)?.campaignObjective,
        timeline: (report.reportContent as any)?.timeline,
        creatorsInvolved: (report.reportContent as any)?.creatorsInvolved,
        performance: (report.reportContent as any)?.performance,
        feedback: (report.reportContent as any)?.feedback,
        recommendations: (report.reportContent as any)?.recommendations,
        nextSteps: (report.reportContent as any)?.nextSteps
      }
    };

    res.json(brandSafeReport);

  } catch (error) {
    console.error('[BRAND REPORT VIEW] Error:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

export default router;
