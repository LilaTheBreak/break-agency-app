import express from 'express';
import { DealStage } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { logError } from '../lib/logger.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

// Get all active opportunities (public)
router.get('/public', async (req, res) => {
  try {
    const opportunities = await prisma.opportunity.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json(opportunities);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
});

// Get all opportunities (admin only)
router.get('/', requireAuth, requireRole(['ADMIN', 'SUPERADMIN', 'AGENCY_ADMIN', 'BRAND']), async (req, res) => {
  try {
    const opportunities = await prisma.opportunity.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        Applications: {
          select: {
            id: true,
            creatorId: true,
            status: true,
            appliedAt: true
          }
        }
      }
    });
    res.json(opportunities || []);
  } catch (error) {
    logError('Error fetching opportunities', error, { userId: req.user?.id });
    // Return empty array instead of 500 - graceful degradation
    res.status(200).json([]);
  }
});

// Get single opportunity
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const opportunity = await prisma.opportunity.findUnique({
      where: { id }
    });
    
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }
    
    res.json(opportunity);
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    res.status(500).json({ error: 'Failed to fetch opportunity' });
  }
});

// Create opportunity (admin only)
router.post('/', requireAuth, requireRole(['ADMIN', 'SUPERADMIN', 'AGENCY_ADMIN', 'BRAND']), async (req, res) => {
  try {
    const {
      brand,
      location,
      title,
      deliverables,
      payment,
      deadline,
      status,
      image,
      logo,
      type,
      isActive
    } = req.body;

    // Get user from session/token
    const createdBy = req.user?.id || 'system';

    const opportunity = await prisma.opportunity.create({
      data: {
        brand,
        location,
        title,
        deliverables,
        payment,
        deadline,
        status: status || 'Live brief · Login required to apply',
        image,
        logo,
        type,
        isActive: isActive !== undefined ? isActive : true,
        createdBy
      }
    });

    res.status(201).json(opportunity);
  } catch (error) {
    console.error('Error creating opportunity:', error);
    res.status(500).json({ error: 'Failed to create opportunity' });
  }
});

// Update opportunity (admin only)
router.put('/:id', requireAuth, requireRole(['ADMIN', 'SUPERADMIN', 'AGENCY_ADMIN', 'BRAND']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      brand,
      location,
      title,
      deliverables,
      payment,
      deadline,
      status,
      image,
      logo,
      type,
      isActive
    } = req.body;

    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: {
        brand,
        location,
        title,
        deliverables,
        payment,
        deadline,
        status,
        image,
        logo,
        type,
        isActive
      }
    });

    res.json(opportunity);
  } catch (error) {
    console.error('Error updating opportunity:', error);
    res.status(500).json({ error: 'Failed to update opportunity' });
  }
});

// Delete opportunity (admin only)
router.delete('/:id', requireAuth, requireRole(['ADMIN', 'SUPERADMIN', 'AGENCY_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.opportunity.delete({
      where: { id }
    });

    res.json({ message: 'Opportunity deleted successfully' });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    res.status(500).json({ error: 'Failed to delete opportunity' });
  }
});

// GET /api/opportunities/creator - Get opportunities for creator with their application status
router.get('/creator/all', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const opportunities = await prisma.opportunity.findMany({
      where: { isActive: true },
      include: {
        Applications: {
          where: { creatorId: userId },
          select: {
            id: true,
            status: true,
            appliedAt: true,
          },
        },
        Submissions: {
          where: { creatorId: userId },
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to include application status
    const opportunitiesWithStatus = opportunities.map((opp) => ({
      ...opp,
      applicationStatus: opp.Applications[0]?.status || null,
      hasSubmission: opp.Submissions.length > 0,
    }));

    res.json({ opportunities: opportunitiesWithStatus });
  } catch (error) {
    console.error('[OPPORTUNITIES] Error fetching creator opportunities:', error);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
});

// POST /api/opportunities/:id/apply - Apply to an opportunity
router.post('/:id/apply', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { pitch, proposedRate } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if opportunity exists
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
    });

    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    if (!opportunity.isActive) {
      return res.status(400).json({ error: 'Opportunity is no longer active' });
    }

    // Check if already applied
    const existingApplication = await prisma.opportunityApplication.findUnique({
      where: {
        opportunityId_creatorId: {
          opportunityId: id,
          creatorId: userId,
        },
      },
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'Already applied to this opportunity' });
    }

    const application = await prisma.opportunityApplication.create({
      data: {
        opportunityId: id,
        creatorId: userId,
        status: 'shortlisted',
        pitch: pitch || '',
        proposedRate: proposedRate || null,
      },
      include: {
        opportunity: true,
      },
    });

    res.status(201).json({ application });
  } catch (error) {
    console.error('[OPPORTUNITIES] Error applying to opportunity:', error);
    res.status(500).json({ error: 'Failed to apply to opportunity' });
  }
});

// GET /api/opportunities/:id/application - Get user's application for an opportunity
router.get('/:id/application', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const application = await prisma.opportunityApplication.findUnique({
      where: {
        opportunityId_creatorId: {
          opportunityId: id,
          creatorId: userId,
        },
      },
      include: {
        opportunity: true,
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ application });
  } catch (error) {
    console.error('[OPPORTUNITIES] Error fetching application:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// ===== ADMIN ENDPOINTS =====

// GET /api/opportunities/admin/applications - Get all applications for admin review
router.get('/admin/applications', requireAuth, requireRole(['ADMIN', 'SUPERADMIN', 'AGENCY_ADMIN']), async (req, res) => {
  try {
    const { status, opportunityId } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (opportunityId) where.opportunityId = opportunityId;

    const applications = await prisma.opportunityApplication.findMany({
      where,
      include: {
        opportunity: {
          select: {
            id: true,
            title: true,
            brand: true,
            payment: true,
            deadline: true,
            status: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            Talent: {
              select: {
                id: true,
                instagramHandle: true,
                tiktokHandle: true,
                youtubeHandle: true,
                followers: true,
              },
            },
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    res.json({ applications });
  } catch (error) {
    console.error('[OPPORTUNITIES] Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// PATCH /api/opportunities/admin/applications/:id - Update application status (admin only)
router.patch('/admin/applications/:id', requireAuth, requireRole(['ADMIN', 'SUPERADMIN', 'AGENCY_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['pending', 'shortlisted', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const application = await prisma.opportunityApplication.update({
      where: { id },
      data: {
        status,
        notes,
        reviewedAt: new Date(),
      },
      include: {
        opportunity: true,
        User: {
          include: {
            Talent: true,
          },
        },
      },
    });

    // If approved, auto-create deal
    if (status === 'approved') {
      await createDealFromApplication(application);
    }

    res.json({ application });
  } catch (error) {
    console.error('[OPPORTUNITIES] Error updating application:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// PATCH /api/opportunities/:id/status - Update opportunity status (admin only)
router.patch('/:id/status', requireAuth, requireRole(['ADMIN', 'SUPERADMIN', 'AGENCY_ADMIN', 'BRAND']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isActive } = req.body;

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (isActive !== undefined) updateData.isActive = isActive;

    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: updateData,
    });

    res.json({ opportunity });
  } catch (error) {
    console.error('[OPPORTUNITIES] Error updating opportunity status:', error);
    res.status(500).json({ error: 'Failed to update opportunity status' });
  }
});

/**
 * Helper function to auto-create deal from approved application
 */
async function createDealFromApplication(application: any) {
  try {
    const userId = application.creatorId;
    const opportunity = application.opportunity;

    // Get or create brand
    let brand = await prisma.brand.findFirst({
      where: { name: opportunity.brand },
    });

    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          id: `brand-${Date.now()}`,
          name: opportunity.brand,
          values: [],
          restrictedCategories: [],
          preferredCreatorTypes: [],
        },
      });
    }

    // Get user's talent profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Talent: true },
    });

    if (!user?.Talent) {
      throw new Error('User does not have a talent profile');
    }

    // Parse payment to extract value
    const paymentMatch = opportunity.payment.match(/[\d,]+/);
    const value = paymentMatch ? parseFloat(paymentMatch[0].replace(/,/g, '')) : 0;

    // Create deal
    const deal = await prisma.deal.create({
      data: {
        id: `deal-${Date.now()}-${userId}`,
        userId: userId,
        talentId: user.Talent.id,
        brandId: brand.id,
        brandName: brand.name,
        stage: DealStage.NEW_LEAD,
        value: value,
        currency: 'USD',
        notes: `Auto-created from opportunity: ${opportunity.title}\n\nCreator pitch: ${application.pitch || 'N/A'}\nProposed rate: ${application.proposedRate ? `$${application.proposedRate}` : 'N/A'}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create timeline entry
    await prisma.dealTimeline.create({
      data: {
        id: `timeline-${Date.now()}`,
        dealId: deal.id,
        userId: userId,
        event: 'DEAL_CREATED',
        description: `Deal created from approved application to opportunity: ${opportunity.title}`,
        metadata: {
          opportunityId: opportunity.id,
          applicationId: application.id,
          source: 'marketplace',
        },
        createdAt: new Date(),
      },
    });

    console.log(`[OPPORTUNITIES] Auto-created deal ${deal.id} from application ${application.id}`);
    return deal;
  } catch (error) {
    console.error('[OPPORTUNITIES] Error creating deal from application:', error);
    // Don't throw - application approval should still succeed
  }
}

export default router;
