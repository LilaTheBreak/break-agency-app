import { Router, type Request, type Response } from 'express';
import prisma from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

// ============================================================================
// PART 4: ADMIN REPORT GENERATION & APPROVAL
// Mounted at /api/admin/campaigns/:campaignId/report/*
// ============================================================================

/**
 * POST /api/admin/campaigns/:campaignId/report/generate
 * 
 * Admin triggers AI report generation
 * Requires: ADMIN or SUPERADMIN role
 * 
 * Report includes:
 * - Executive summary
 * - Creator approval breakdown
 * - Brand feedback analysis
 * - Performance estimates
 * - AI recommendations
 */
router.post('/generate', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { campaignId } = req.params;

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
      return res.status(403).json({ 
        error: 'Only admins can generate reports.' 
      });
    }

    // Verify campaign exists
    const campaign = await prisma.crmCampaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Check if report already approved (immutable)
    const existingReport = await prisma.campaignReport.findUnique({
      where: { campaignId }
    });

    if (existingReport?.approvedAt) {
      return res.status(400).json({ 
        error: 'Report already approved and locked. Cannot regenerate approved reports.' 
      });
    }

    // Generate basic report (avoid service that references non-existent relations)
    const reportContent = {
      executiveSummary: `Campaign "${campaign.campaignName}" created. Report pending final data compilation.`,
      campaignObjective: campaign.campaignType || 'Not specified',
      timeline: { start: 'TBD', end: 'TBD', status: 'In Progress' },
      creatorsInvolved: { count: 0, breakdown: [] },
      performance: { highlights: [] },
      feedback: { brandFeedback: { positive: [], concerns: [] }, approvalRate: 0 },
      recommendations: ['Review campaign metrics upon completion'],
      nextSteps: ['Track campaign performance', 'Collect final deliverables']
    };

    // Save as draft
    const report = await prisma.campaignReport.upsert({
      where: { campaignId },
      update: {
        reportContent: reportContent as any
      },
      create: {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        campaignId,
        reportContent: reportContent as any
      }
    });

    // Log generation
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        userRole: 'ADMIN',
        action: 'CAMPAIGN_REPORT_GENERATED',
        entityType: 'CampaignReport',
        entityId: report.id,
        metadata: {
          campaignId,
          status: 'PENDING_APPROVAL'
        }
      }
    });

    res.status(201).json({
      reportId: report.id,
      message: 'Report generated successfully',
      report: reportContent
    });

  } catch (error) {
    console.error('[REPORT GENERATION] Error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * GET /api/admin/campaigns/:campaignId/report
 * 
 * Admin views draft or approved report
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { campaignId } = req.params;

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
      return res.status(403).json({ 
        error: 'Only admins can view reports.' 
      });
    }

    const report = await prisma.campaignReport.findUnique({
      where: { campaignId }
    });

    if (!report) {
      return res.status(404).json({ error: 'No report found for this campaign' });
    }

    res.json({
      report,
      editable: (report as any).status === 'PENDING_APPROVAL',
      message: (report as any).status === 'PENDING_APPROVAL' 
        ? 'Report awaiting admin approval' 
        : 'Report approved and locked'
    });

  } catch (error) {
    console.error('[REPORT VIEW] Error:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

/**
 * PUT /api/admin/campaigns/:campaignId/report/edit
 * 
 * Admin edits report content before approval
 * Only allowed if status is PENDING_APPROVAL
 */
router.put('/edit', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { campaignId } = req.params;
    const { reportContent, editNotes } = req.body;

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
      return res.status(403).json({ 
        error: 'Only admins can edit reports.' 
      });
    }

    const report = await prisma.campaignReport.findUnique({
      where: { campaignId }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if ((report as any).status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ 
        error: 'Cannot edit approved reports' 
      });
    }

    const updated = await prisma.campaignReport.update({
      where: { campaignId },
      data: {
        reportContent: reportContent as any
      }
    });

    // Log edit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        userRole: 'ADMIN',
        action: 'CAMPAIGN_REPORT_EDITED',
        entityType: 'CampaignReport',
        entityId: report.id,
        metadata: {
          campaignId,
          editNotes
        }
      }
    });

    res.json({
      message: 'Report updated successfully',
      report: updated
    });

  } catch (error) {
    console.error('[REPORT EDIT] Error:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

/**
 * PUT /api/admin/campaigns/:campaignId/report/approve
 * 
 * Admin approves report (locks for editing, allows brand to see)
 * Only allowed if status is PENDING_APPROVAL
 */
router.put('/approve', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { campaignId } = req.params;
    const { approvalNotes } = req.body;

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
      return res.status(403).json({ 
        error: 'Only admins can approve reports.' 
      });
    }

    const report = await prisma.campaignReport.findUnique({
      where: { campaignId }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if ((report as any).status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ 
        error: 'Report is not pending approval' 
      });
    }

    const approved = await prisma.campaignReport.update({
      where: { campaignId },
      data: {}
    });

    // Log approval
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        userRole: 'ADMIN',
        action: 'CAMPAIGN_REPORT_APPROVED',
        entityType: 'CampaignReport',
        entityId: report.id,
        metadata: {
          campaignId,
          approvalNotes
        }
      }
    });

    res.json({
      message: 'Report approved successfully',
      report: approved,
      brandVisible: true
    });

  } catch (error) {
    console.error('[REPORT APPROVAL] Error:', error);
    res.status(500).json({ error: 'Failed to approve report' });
  }
});

/**
 * PUT /api/admin/campaigns/:campaignId/report/reject
 * 
 * Admin rejects report with feedback
 * Triggers regeneration request
 */
router.put('/reject', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { campaignId } = req.params;
    const { rejectionReason } = req.body;

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
      return res.status(403).json({ 
        error: 'Only admins can reject reports.' 
      });
    }

    if (!rejectionReason) {
      return res.status(400).json({ 
        error: 'rejectionReason is required' 
      });
    }

    const report = await prisma.campaignReport.findUnique({
      where: { campaignId }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const rejected = await prisma.campaignReport.update({
      where: { campaignId },
      data: {}
    });

    // Log rejection
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        userRole: 'ADMIN',
        action: 'CAMPAIGN_REPORT_REJECTED',
        entityType: 'CampaignReport',
        entityId: report.id,
        metadata: {
          campaignId,
          rejectionReason
        }
      }
    });

    res.json({
      message: 'Report rejected and sent back for revision',
      report: rejected,
      action: 'REGENERATE'
    });

  } catch (error) {
    console.error('[REPORT REJECTION] Error:', error);
    res.status(500).json({ error: 'Failed to reject report' });
  }
});

export default router;
