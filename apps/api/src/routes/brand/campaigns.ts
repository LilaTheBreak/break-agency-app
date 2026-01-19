import { Router, type Request, type Response } from 'express';
import prisma from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

/**
 * POST /api/brand/campaigns
 * 
 * Brand user creates a new campaign
 * Requires: BRAND role, linked to a brand
 * Creates: CrmCampaign with PENDING_ADMIN_REVIEW status
 * 
 * Body:
 * {
 *   campaignName: string
 *   objective: "AWARENESS" | "CONVERSION" | "LAUNCH" | "EVENT"
 *   platforms: string[] (e.g., ["Instagram", "TikTok", "YouTube"])
 *   targetRegion: string[] (e.g., ["UK", "US", "EU"])
 *   budgetRange: string (e.g., "£5K-£10K")
 *   preferredStartDate: ISO date string
 *   preferredEndDate: ISO date string
 *   flexibilityToggle: boolean (fixed vs flexible timeline)
 *   contentVerticals: string[] (e.g., ["Fashion", "Tech", "Beauty"])
 *   audiencePreferences: { ageRange?: string, interests?: string[] }
 *   creatorSizeRange: "NANO" | "MICRO" | "MID" | "MACRO"
 * }
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Guard: Only BRAND role can create campaigns
    if (user?.role !== 'BRAND') {
      return res.status(403).json({ 
        error: 'Only brand users can create campaigns. Contact an admin to change your role.' 
      });
    }

    // Get brand ID from BrandUser join table
    const brandUser = await prisma.brandUser.findFirst({
      where: { userId: user.id }
    });

    if (!brandUser) {
      return res.status(403).json({ 
        error: 'You are not linked to any brand. Contact your admin to link you to a brand.' 
      });
    }

    const {
      campaignName,
      objective,
      platforms,
      targetRegion,
      budgetRange,
      preferredStartDate,
      preferredEndDate,
      flexibilityToggle,
      contentVerticals,
      audiencePreferences,
      creatorSizeRange
    } = req.body;

    // Validate required fields
    if (!campaignName || !objective || !platforms?.length) {
      return res.status(400).json({ 
        error: 'Missing required fields: campaignName, objective, platforms' 
      });
    }

    // Create campaign with PENDING_ADMIN_REVIEW status
    const campaign = await prisma.crmCampaign.create({
      data: {
        id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        campaignName,
        brandId: brandUser.brandId,
        
        // Submission tracking
        submittedByUserId: user.id,
        submissionSource: 'BRAND_PORTAL',
        approvalStatus: 'PENDING_ADMIN_REVIEW',
        
        // Brand preferences
        campaignObjective: objective,
        platforms: platforms || [],
        targetRegion: targetRegion || [],
        budgetRange,
        contentVerticals: contentVerticals || [],
        audiencePreferences: audiencePreferences || {},
        creatorSizeRange,
        
        // Timeline
        preferredStartDate: preferredStartDate ? new Date(preferredStartDate) : null,
        preferredEndDate: preferredEndDate ? new Date(preferredEndDate) : null,
        flexibilityToggle: flexibilityToggle ?? true,
        
        // CRM defaults
        status: 'Draft',
        campaignType: objective || 'Other',
        activity: [{
          at: new Date().toISOString(),
          label: 'Campaign created by brand user'
        }],
        lastActivityAt: new Date()
      },
      include: {
        Brand: {
          select: { id: true, name: true }
        }
      }
    });

    // Log action to audit trail
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        userRole: 'BRAND',
        action: 'BRAND_CAMPAIGN_CREATED',
        entityType: 'CrmCampaign',
        entityId: campaign.id,
        metadata: {
          campaignName,
          brandId: brandUser.brandId,
          objective
        }
      }
    });

    // TODO: Send admin notification
    // Should trigger a task/email to admins that a new campaign needs review
    console.log(`[BRAND CAMPAIGNS] New campaign created: ${campaign.id} by user ${user.id}`);

    res.status(201).json({
      campaignId: campaign.id,
      campaignName: campaign.campaignName,
      status: campaign.approvalStatus,
      submittedAt: campaign.createdAt,
      brand: campaign.Brand
    });

  } catch (error) {
    console.error('[BRAND CAMPAIGNS] Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

/**
 * GET /api/brand/campaigns
 * 
 * List campaigns submitted by this brand user
 * Only shows campaigns for the brand they're linked to
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (user?.role !== 'BRAND') {
      return res.status(403).json({ 
        error: 'Only brand users can view campaigns.' 
      });
    }

    const brandUser = await prisma.brandUser.findFirst({
      where: { userId: user.id }
    });

    if (!brandUser) {
      return res.status(403).json({ 
        error: 'You are not linked to any brand. Contact your admin to link you to a brand.' 
      });
    }

    // Get all campaigns for this brand
    const campaigns = await prisma.crmCampaign.findMany({
      where: {
        brandId: brandUser.brandId,
        submissionSource: 'BRAND_PORTAL' // Only show brand-created campaigns
      },
      select: {
        id: true,
        campaignName: true,
        approvalStatus: true,
        status: true,
        campaignObjective: true,
        platforms: true,
        budgetRange: true,
        preferredStartDate: true,
        preferredEndDate: true,
        createdAt: true,
        updatedAt: true,
        CreatorShortlist: {
          select: {
            id: true,
            brandApprovalStatus: true,
            aiExplanation: true,
            Talent: {
              select: {
                id: true,
                name: true,
                profileImageUrl: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      campaigns,
      count: campaigns.length
    });

  } catch (error) {
    console.error('[BRAND CAMPAIGNS] Error listing campaigns:', error);
    res.status(500).json({ error: 'Failed to list campaigns' });
  }
});

/**
 * GET /api/brand/campaigns/:campaignId
 * 
 * View a specific campaign
 * Brand user can only view campaigns from their brand
 */
router.get('/:campaignId', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { campaignId } = req.params;

    if (user?.role !== 'BRAND') {
      return res.status(403).json({ 
        error: 'Only brand users can view campaigns.' 
      });
    }

    const brandUser = await prisma.brandUser.findFirst({
      where: { userId: user.id }
    });

    if (!brandUser) {
      return res.status(403).json({ 
        error: 'You are not linked to any brand. Contact your admin to link you to a brand.' 
      });
    }

    const campaign = await prisma.crmCampaign.findFirst({
      where: {
        id: campaignId,
        brandId: brandUser.brandId,
        submissionSource: 'BRAND_PORTAL'
      },
      include: {
        Brand: {
          select: { id: true, name: true }
        },
        CreatorShortlist: {
          select: {
            id: true,
            brandApprovalStatus: true,
            aiExplanation: true,
            adminNotes: false, // Hide admin notes from brand
            Talent: {
              select: {
                id: true,
                name: true,
                profileImageUrl: true,
                SocialAccountConnection: {
                  where: { connected: true },
                  select: { platform: true, username: true, followerCount: true }
                }
              }
            }
          }
        },
        CampaignApprovals: {
          select: {
            id: true,
            action: true,
            actorRole: true,
            reason: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(campaign);

  } catch (error) {
    console.error('[BRAND CAMPAIGNS] Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

/**
 * POST /api/brand/campaigns/:campaignId/feedback
 * 
 * Brand submits feedback about campaign preferences or performance
 * Stores learning signals for AI to improve future recommendations
 * 
 * Body:
 * {
 *   feedbackType: "APPROVAL" | "REJECTION" | "PREFERENCE" | "CONCERN"
 *   content: string (detailed feedback)
 *   signals: string[] (e.g., ["good_fit", "audience_mismatch", "budget_constraint"])
 * }
 */
router.post('/:campaignId/feedback', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { campaignId } = req.params;
    const { feedbackType, content, signals } = req.body;

    if (user?.role !== 'BRAND') {
      return res.status(403).json({ 
        error: 'Only brand users can submit feedback.' 
      });
    }

    const brandUser = await prisma.brandUser.findFirst({
      where: { userId: user.id }
    });

    if (!brandUser) {
      return res.status(403).json({ 
        error: 'You are not linked to any brand. Contact your admin to link you to a brand.' 
      });
    }

    // Verify campaign belongs to this brand
    const campaign = await prisma.crmCampaign.findFirst({
      where: {
        id: campaignId,
        brandId: brandUser.brandId
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (!feedbackType || !content) {
      return res.status(400).json({ 
        error: 'Missing required fields: feedbackType, content' 
      });
    }

    // Create feedback record
    const feedback = await prisma.campaignFeedback.create({
      data: {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        campaignId,
        feedbackType: feedbackType as any,
        content,
        signals: signals || [],
        submittedByUserId: user.id,
        submittedAt: new Date()
      }
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        userRole: 'BRAND',
        action: 'BRAND_CAMPAIGN_FEEDBACK_SUBMITTED',
        entityType: 'CampaignFeedback',
        entityId: feedback.id,
        metadata: {
          campaignId,
          feedbackType,
          signals
        }
      }
    });

    console.log(`[BRAND CAMPAIGNS] Feedback submitted for campaign ${campaignId} by user ${user.id}`);

    res.status(201).json({
      feedbackId: feedback.id,
      campaignId,
      feedbackType,
      submittedAt: feedback.submittedAt
    });

  } catch (error) {
    console.error('[BRAND CAMPAIGNS] Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

export default router;
