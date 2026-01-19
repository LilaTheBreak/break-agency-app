import { Router, type Request, type Response } from 'express';
import prisma from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { 
  generateCampaignReport, 
  saveCampaignReport, 
  releaseCampaignReport 
} from '../../services/campaignReportService.js';

const router = Router();

// ============================================================================
// ADMIN ENDPOINTS — Curate shortlist and manage approvals
// ============================================================================

/**
 * POST /api/admin/campaigns/:campaignId/shortlist
 * 
 * Admin curates creator shortlist for a campaign
 * Requires: ADMIN role
 * Creates: CreatorShortlist entries with AI explanations
 * 
 * Body:
 * {
 *   creators: [
 *     { talentId: string, aiExplanation: string },
 *     ...
 *   ]
 * }
 */
router.post('/admin/campaigns/:campaignId/shortlist', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { campaignId } = req.params;
    const { creators } = req.body;

    // Guard: Only ADMIN role can curate shortlist
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
      return res.status(403).json({ 
        error: 'Only admins can curate creator shortlists.' 
      });
    }

    // Verify campaign exists
    const campaign = await prisma.crmCampaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (!creators || !Array.isArray(creators) || creators.length === 0) {
      return res.status(400).json({ 
        error: 'Must provide at least one creator' 
      });
    }

    // Create shortlist entries
    const shortlistEntries = await Promise.all(
      creators.map(creator =>
        prisma.creatorShortlist.upsert({
          where: {
            campaignId_talentId: {
              campaignId,
              talentId: creator.talentId
            }
          },
          create: {
            campaignId,
            talentId: creator.talentId,
            aiExplanation: creator.aiExplanation || '',
            addedByAdminId: user.id,
            brandApprovalStatus: 'PENDING_BRAND_APPROVAL'
          },
          update: {
            aiExplanation: creator.aiExplanation || undefined,
            addedByAdminId: user.id
          },
          include: {
            Talent: {
              select: { id: true, name: true }
            }
          }
        })
      )
    );

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        userRole: 'ADMIN',
        action: 'ADMIN_CURATED_SHORTLIST',
        entityType: 'CrmCampaign',
        entityId: campaignId,
        metadata: {
          creatorCount: creators.length
        }
      }
    });

    // Log approval action
    await prisma.campaignApproval.create({
      data: {
        campaignId,
        action: 'ADMIN_CURATED_SHORTLIST',
        actorId: user.id,
        actorRole: 'ADMIN',
        metadata: {
          creatorCount: creators.length
        }
      }
    });

    res.status(201).json({
      shortlist: shortlistEntries,
      count: shortlistEntries.length
    });

  } catch (error) {
    console.error('[SHORTLIST] Error curating shortlist:', error);
    res.status(500).json({ error: 'Failed to curate shortlist' });
  }
});

/**
 * PUT /api/admin/shortlist/:shortlistId
 * 
 * Admin updates shortlist entry (notes, explanations)
 * Requires: ADMIN role
 * 
 * Body:
 * {
 *   adminNotes?: string
 *   aiExplanation?: string
 * }
 */
router.put('/admin/shortlist/:shortlistId', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { shortlistId } = req.params;
    const { adminNotes, aiExplanation } = req.body;

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
      return res.status(403).json({ 
        error: 'Only admins can update shortlists.' 
      });
    }

    const shortlist = await prisma.creatorShortlist.update({
      where: { id: shortlistId },
      data: {
        adminNotes: adminNotes !== undefined ? adminNotes : undefined,
        aiExplanation: aiExplanation !== undefined ? aiExplanation : undefined
      },
      include: {
        Talent: { select: { id: true, name: true } }
      }
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        userRole: 'ADMIN',
        action: 'ADMIN_UPDATED_SHORTLIST',
        entityType: 'CreatorShortlist',
        entityId: shortlistId
      }
    });

    res.json(shortlist);

  } catch (error) {
    console.error('[SHORTLIST] Error updating shortlist:', error);
    res.status(500).json({ error: 'Failed to update shortlist' });
  }
});

/**
 * PUT /api/admin/shortlist/:shortlistId/override
 * 
 * Admin overrides a brand rejection
 * Requires: ADMIN role + reason
 * 
 * Body:
 * {
 *   reason: string (required)
 * }
 */
router.put('/admin/shortlist/:shortlistId/override', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { shortlistId } = req.params;
    const { reason } = req.body;

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
      return res.status(403).json({ 
        error: 'Only admins can override brand decisions.' 
      });
    }

    if (!reason) {
      return res.status(400).json({ 
        error: 'Reason is required for override' 
      });
    }

    const shortlist = await prisma.creatorShortlist.update({
      where: { id: shortlistId },
      data: {
        brandApprovalStatus: 'APPROVED',
        adminOverrideReason: reason,
        adminOverrideAt: new Date(),
        adminOverrideByUserId: user.id
      },
      include: {
        Campaign: { select: { id: true, campaignName: true } },
        Talent: { select: { id: true, name: true } }
      }
    });

    // Log action
    await prisma.campaignApproval.create({
      data: {
        campaignId: shortlist.campaignId,
        action: 'ADMIN_OVERRIDE',
        actorId: user.id,
        actorRole: 'ADMIN',
        reason,
        metadata: {
          shortlistId,
          talentId: shortlist.talentId,
          talentName: shortlist.Talent?.name
        }
      }
    });

    res.json({
      shortlist,
      message: `Override approved creator: ${shortlist.Talent?.name}`
    });

  } catch (error) {
    console.error('[SHORTLIST] Error overriding brand decision:', error);
    res.status(500).json({ error: 'Failed to override decision' });
  }
});

// ============================================================================
// BRAND ENDPOINTS — Approve/reject creators from shortlist
// ============================================================================

/**
 * GET /api/brand/shortlist
 * 
 * Brand views pending creator shortlist for their campaigns
 * Only shows creators awaiting brand approval
 */
router.get('/brand/shortlist', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (user?.role !== 'BRAND') {
      return res.status(403).json({ 
        error: 'Only brand users can view shortlists.' 
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

    // Get all pending shortlist items for this brand's campaigns
    const shortlist = await prisma.creatorShortlist.findMany({
      where: {
        Campaign: { brandId: brandUser.brandId },
        brandApprovalStatus: 'PENDING_BRAND_APPROVAL'
      },
      include: {
        Campaign: { select: { id: true, campaignName: true } },
        Talent: {
          select: {
            id: true,
            name: true,
            displayName: true,
            profileImageUrl: true,
            SocialAccountConnection: {
              where: { connected: true },
              select: { platform: true, username: true, followerCount: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      shortlist,
      count: shortlist.length
    });

  } catch (error) {
    console.error('[SHORTLIST] Error fetching brand shortlist:', error);
    res.status(500).json({ error: 'Failed to fetch shortlist' });
  }
});

/**
 * PUT /api/brand/shortlist/:shortlistId/approve
 * 
 * Brand approves a creator from shortlist
 * Requires: BRAND role
 * 
 * Body:
 * {
 *   feedback?: string
 * }
 */
router.put('/brand/shortlist/:shortlistId/approve', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { shortlistId } = req.params;
    const { feedback } = req.body;

    if (user?.role !== 'BRAND') {
      return res.status(403).json({ 
        error: 'Only brand users can approve creators.' 
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

    // Verify shortlist belongs to brand's campaign
    const shortlist = await prisma.creatorShortlist.findFirst({
      where: {
        id: shortlistId,
        Campaign: { brandId: brandUser.brandId }
      }
    });

    if (!shortlist) {
      return res.status(404).json({ error: 'Shortlist entry not found' });
    }

    // Approve
    const updated = await prisma.creatorShortlist.update({
      where: { id: shortlistId },
      data: {
        brandApprovalStatus: 'APPROVED',
        brandApprovedAt: new Date(),
        brandApprovedByUserId: user.id
      },
      include: {
        Campaign: { select: { id: true, campaignName: true } },
        Talent: { select: { id: true, name: true } }
      }
    });

    // Log approval action
    await prisma.campaignApproval.create({
      data: {
        campaignId: updated.campaignId,
        action: 'BRAND_APPROVED',
        actorId: user.id,
        actorRole: 'BRAND',
        reason: feedback,
        metadata: {
          shortlistId,
          talentId: updated.talentId
        }
      }
    });

    // Log feedback if provided
    if (feedback) {
      await prisma.campaignFeedback.create({
        data: {
          campaignId: updated.campaignId,
          shortlistId,
          feedbackType: 'APPROVAL',
          content: feedback,
          submittedByUserId: user.id,
          signals: ['approved_by_brand']
        }
      });
    }

    res.json({
      shortlist: updated,
      message: `Approved: ${updated.Talent?.name}`
    });

  } catch (error) {
    console.error('[SHORTLIST] Error approving creator:', error);
    res.status(500).json({ error: 'Failed to approve creator' });
  }
});

/**
 * PUT /api/brand/shortlist/:shortlistId/reject
 * 
 * Brand rejects a creator from shortlist
 * Requires: BRAND role + reason
 * 
 * Body:
 * {
 *   reason: string (required)
 *   feedback?: string
 * }
 */
router.put('/brand/shortlist/:shortlistId/reject', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { shortlistId } = req.params;
    const { reason, feedback } = req.body;

    if (user?.role !== 'BRAND') {
      return res.status(403).json({ 
        error: 'Only brand users can reject creators.' 
      });
    }

    if (!reason) {
      return res.status(400).json({ 
        error: 'Reason is required for rejection' 
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

    const shortlist = await prisma.creatorShortlist.findFirst({
      where: {
        id: shortlistId,
        Campaign: { brandId: brandUser.brandId }
      }
    });

    if (!shortlist) {
      return res.status(404).json({ error: 'Shortlist entry not found' });
    }

    // Reject
    const updated = await prisma.creatorShortlist.update({
      where: { id: shortlistId },
      data: {
        brandApprovalStatus: 'REJECTED',
        brandApprovedAt: new Date(),
        brandApprovedByUserId: user.id
      },
      include: {
        Campaign: { select: { id: true, campaignName: true } },
        Talent: { select: { id: true, name: true } }
      }
    });

    // Log approval action
    await prisma.campaignApproval.create({
      data: {
        campaignId: updated.campaignId,
        action: 'BRAND_REJECTED',
        actorId: user.id,
        actorRole: 'BRAND',
        reason,
        metadata: {
          shortlistId,
          talentId: updated.talentId
        }
      }
    });

    // Log feedback
    await prisma.campaignFeedback.create({
      data: {
        campaignId: updated.campaignId,
        shortlistId,
        feedbackType: 'REJECTION',
        content: feedback || reason,
        submittedByUserId: user.id,
        signals: ['rejected_by_brand', reason?.toLowerCase() || 'other']
      }
    });

    res.json({
      shortlist: updated,
      message: `Rejected: ${updated.Talent?.name}. Admin can override with strong justification.`
    });

  } catch (error) {
    console.error('[SHORTLIST] Error rejecting creator:', error);
    res.status(500).json({ error: 'Failed to reject creator' });
  }
});

/**
 * PUT /api/brand/shortlist/:shortlistId/revise
 * 
 * Brand requests revision (alternative creators)
 * Requires: BRAND role
 * 
 * Body:
 * {
 *   feedback: string (required)
 * }
 */
router.put('/brand/shortlist/:shortlistId/revise', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { shortlistId } = req.params;
    const { feedback } = req.body;

    if (user?.role !== 'BRAND') {
      return res.status(403).json({ 
        error: 'Only brand users can request revisions.' 
      });
    }

    if (!feedback) {
      return res.status(400).json({ 
        error: 'Feedback is required for revision request' 
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

    const shortlist = await prisma.creatorShortlist.findFirst({
      where: {
        id: shortlistId,
        Campaign: { brandId: brandUser.brandId }
      }
    });

    if (!shortlist) {
      return res.status(404).json({ error: 'Shortlist entry not found' });
    }

    // Mark as revision requested
    const updated = await prisma.creatorShortlist.update({
      where: { id: shortlistId },
      data: {
        brandApprovalStatus: 'REVISION_REQUESTED',
        brandApprovedAt: new Date(),
        brandApprovedByUserId: user.id
      },
      include: {
        Campaign: { select: { id: true, campaignName: true } },
        Talent: { select: { id: true, name: true } }
      }
    });

    // Log action
    await prisma.campaignApproval.create({
      data: {
        campaignId: updated.campaignId,
        action: 'BRAND_REVISION_REQUESTED',
        actorId: user.id,
        actorRole: 'BRAND',
        reason: feedback,
        metadata: {
          shortlistId,
          talentId: updated.talentId
        }
      }
    });

    // Log feedback
    await prisma.campaignFeedback.create({
      data: {
        campaignId: updated.campaignId,
        shortlistId,
        feedbackType: 'PREFERENCE',
        content: feedback,
        submittedByUserId: user.id,
        signals: ['revision_requested']
      }
    });

    res.json({
      shortlist: updated,
      message: 'Revision requested. Admin will review your feedback and provide alternatives.'
    });

  } catch (error) {
    console.error('[SHORTLIST] Error requesting revision:', error);
    res.status(500).json({ error: 'Failed to request revision' });
  }
});

// ============================================================================
// ADMIN REPORT ENDPOINTS — Generate, approve, and release campaign reports
// ============================================================================

/**
 * POST /api/admin/campaigns/:campaignId/generate-report
 * 
 * Admin generates an AI-written campaign report
 * Analyzes: campaign data, creator approvals, brand feedback
 * Report is brand-safe (no internal notes, earnings, etc)
 * Report status: DRAFT (pending admin approval)
 */
router.post('/admin/campaigns/:campaignId/generate-report', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { campaignId } = req.params;

    // Guard: Only ADMIN role can generate reports
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
      return res.status(403).json({ 
        error: 'Only admins can generate campaign reports.' 
      });
    }

    // Verify campaign exists
    const campaign = await prisma.crmCampaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Generate report content (AI analysis)
    const reportContent = await generateCampaignReport(campaignId, user.id);

    // Save report in DRAFT status (not yet approved for brand)
    const report = await prisma.campaignReport.upsert({
      where: { campaignId },
      update: {
        reportContent,
        generatedAt: new Date()
      },
      create: {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        campaignId,
        reportContent,
        tone: 'PROFESSIONAL',
        generatedAt: new Date()
        // Note: NOT setting approvedByAdminId or approvedAt - status is DRAFT
      }
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userRole: 'ADMIN',
        action: 'CAMPAIGN_REPORT_GENERATED',
        entityType: 'CampaignReport',
        entityId: report.id,
        metadata: {
          campaignId,
          reportSummary: reportContent.executiveSummary
        }
      }
    });

    console.log(`[ADMIN REPORTS] Report generated for campaign ${campaignId}`);

    res.status(201).json({
      reportId: report.id,
      campaignId,
      status: 'DRAFT',
      reportContent,
      generatedAt: report.generatedAt,
      message: 'Report generated. Review and approve to release to brand.'
    });

  } catch (error) {
    console.error('[ADMIN REPORTS] Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * GET /api/admin/campaigns/:campaignId/report
 * 
 * Admin views draft or approved campaign report
 * Includes edit status and approval workflow info
 */
router.get('/admin/campaigns/:campaignId/report', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { campaignId } = req.params;

    // Guard: Only ADMIN role
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
      return res.status(403).json({ 
        error: 'Only admins can view campaign reports.' 
      });
    }

    const report = await prisma.campaignReport.findUnique({
      where: { campaignId },
      include: {
        ApprovedByAdmin: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({
      reportId: report.id,
      campaignId,
      reportContent: report.reportContent,
      status: report.approvedAt ? 'APPROVED' : (report.releasedAt ? 'RELEASED' : 'DRAFT'),
      generatedAt: report.generatedAt,
      approvedAt: report.approvedAt,
      approvedByAdmin: report.ApprovedByAdmin,
      releasedAt: report.releasedAt
    });

  } catch (error) {
    console.error('[ADMIN REPORTS] Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

/**
 * PUT /api/admin/campaigns/:campaignId/report
 * 
 * Admin edits draft report content before approval
 * Only allowed in DRAFT status
 */
router.put('/admin/campaigns/:campaignId/report', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { campaignId } = req.params;
    const { reportContent } = req.body;

    // Guard: Only ADMIN role
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
      return res.status(403).json({ 
        error: 'Only admins can edit campaign reports.' 
      });
    }

    const report = await prisma.campaignReport.findUnique({
      where: { campaignId }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Only allow edits if not approved yet
    if (report.approvedAt) {
      return res.status(400).json({ 
        error: 'Cannot edit approved reports. Create new version instead.' 
      });
    }

    const updated = await prisma.campaignReport.update({
      where: { campaignId },
      data: {
        reportContent
      }
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userRole: 'ADMIN',
        action: 'CAMPAIGN_REPORT_EDITED',
        entityType: 'CampaignReport',
        entityId: report.id,
        metadata: { campaignId }
      }
    });

    res.json({
      reportId: updated.id,
      status: 'DRAFT',
      reportContent: updated.reportContent,
      message: 'Report updated. Review and then approve to release.'
    });

  } catch (error) {
    console.error('[ADMIN REPORTS] Error editing report:', error);
    res.status(500).json({ error: 'Failed to edit report' });
  }
});

/**
 * POST /api/admin/campaigns/:campaignId/report/approve
 * 
 * Admin approves draft report
 * After approval, report can be released to brand
 */
router.post('/admin/campaigns/:campaignId/report/approve', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { campaignId } = req.params;

    // Guard: Only ADMIN role
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
      return res.status(403).json({ 
        error: 'Only admins can approve campaign reports.' 
      });
    }

    const report = await prisma.campaignReport.findUnique({
      where: { campaignId }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (report.approvedAt) {
      return res.status(400).json({ 
        error: 'Report already approved.' 
      });
    }

    // Approve report
    const approved = await prisma.campaignReport.update({
      where: { campaignId },
      data: {
        approvedByAdminId: user.id,
        approvedAt: new Date()
      }
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userRole: 'ADMIN',
        action: 'CAMPAIGN_REPORT_APPROVED',
        entityType: 'CampaignReport',
        entityId: report.id,
        metadata: { campaignId }
      }
    });

    console.log(`[ADMIN REPORTS] Report approved for campaign ${campaignId}`);

    res.json({
      reportId: approved.id,
      status: 'APPROVED',
      approvedAt: approved.approvedAt,
      message: 'Report approved. You can now release it to the brand.'
    });

  } catch (error) {
    console.error('[ADMIN REPORTS] Error approving report:', error);
    res.status(500).json({ error: 'Failed to approve report' });
  }
});

/**
 * POST /api/admin/campaigns/:campaignId/report/release
 * 
 * Admin releases approved report to brand user
 * Brand can then view report via GET /api/brand/campaigns/:id/report
 */
router.post('/admin/campaigns/:campaignId/report/release', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { campaignId } = req.params;

    // Guard: Only ADMIN role
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
      return res.status(403).json({ 
        error: 'Only admins can release campaign reports.' 
      });
    }

    const report = await prisma.campaignReport.findUnique({
      where: { campaignId }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (!report.approvedAt) {
      return res.status(400).json({ 
        error: 'Cannot release unapproved reports. Approve first.' 
      });
    }

    if (report.releasedAt) {
      return res.status(400).json({ 
        error: 'Report already released.' 
      });
    }

    // Release report
    const released = await releaseCampaignReport(campaignId, user.id);

    console.log(`[ADMIN REPORTS] Report released to brand for campaign ${campaignId}`);

    res.json({
      reportId: released.id,
      status: 'RELEASED',
      releasedAt: released.releasedAt,
      message: 'Report released to brand. They can now view it.'
    });

  } catch (error) {
    console.error('[ADMIN REPORTS] Error releasing report:', error);
    res.status(500).json({ error: 'Failed to release report' });
  }
});

// ============================================================================
// BRAND REPORT ENDPOINTS — View approved reports
// ============================================================================

/**
 * GET /api/brand/campaigns/:campaignId/report
 * 
 * Brand views approved campaign report
 * Only available after admin releases report
 * Tracks when brand views report
 */
router.get('/brand/campaigns/:campaignId/report', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { campaignId } = req.params;

    // Guard: Brand role only
    if (user?.role !== 'BRAND') {
      return res.status(403).json({ 
        error: 'Only brand users can view campaign reports.' 
      });
    }

    // Verify brand access to campaign
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
        brandId: brandUser.brandId
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Fetch report (must be released)
    const report = await prisma.campaignReport.findUnique({
      where: { campaignId }
    });

    if (!report) {
      return res.status(404).json({ 
        error: 'Report not available yet. Admin is still preparing it.' 
      });
    }

    if (!report.releasedAt) {
      return res.status(403).json({ 
        error: 'Report not yet released. Contact admin for availability.' 
      });
    }

    // Update view timestamp
    const updated = await prisma.campaignReport.update({
      where: { campaignId },
      data: {
        viewedByBrandAt: new Date()
      }
    });

    res.json({
      reportId: report.id,
      campaignId,
      reportContent: report.reportContent,
      generatedAt: report.generatedAt,
      releasedAt: report.releasedAt,
      viewedAt: updated.viewedByBrandAt,
      message: 'Campaign report ready for review.'
    });

  } catch (error) {
    console.error('[BRAND REPORTS] Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

export default router;
