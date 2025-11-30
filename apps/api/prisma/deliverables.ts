import { Router } from 'express';
import prisma from '../../lib/prisma.js';

const router = Router();

/**
 * POST /api/brand/campaigns/:id/deliverables
 * Allows a creator to submit a deliverable for a campaign.
 */
router.post('/campaigns/:id/deliverables', async (req, res, next) => {
  try {
    const campaignId = req.params.id;
    const creatorId = 'some_creator_user_id'; // from auth
    const { type, fileUrl, notes } = req.body;

    const deliverable = await prisma.campaignDeliverable.create({
      data: {
        campaignId,
        creatorId,
        type,
        fileUrl,
        notes,
        status: 'submitted',
        submittedAt: new Date(),
      },
    });
    res.status(201).json(deliverable);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/brand/campaigns/:id/deliverables
 * Fetches all deliverables for a specific campaign.
 */
router.get('/campaigns/:id/deliverables', async (req, res, next) => {
  try {
    const deliverables = await prisma.campaignDeliverable.findMany({ where: { campaignId: req.params.id } });
    res.json(deliverables);
  } catch (error) {
    next(error);
  }
});

export default router;