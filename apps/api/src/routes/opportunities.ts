import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

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
router.get('/', async (req, res) => {
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
    res.json(opportunities);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
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
router.post('/', async (req, res) => {
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
router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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

export default router;
