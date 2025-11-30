import { Router } from 'express';
import prisma from '../../lib/prisma.js';

const router = Router();

const getUserId = () => 'some_creator_user_id'; // Mock

/**
 * POST /api/brand/campaigns/:id/invite
 * Sends an invitation to a creator for a specific campaign.
 */
router.post('/campaigns/:id/invite', async (req, res, next) => {
  try {
    const campaignId = req.params.id;
    const { creatorId, message, paymentOffer } = req.body;
    const brandId = 'some_brand_user_id'; // from auth

    // Add logic to check if brand can invite this creator type (e.g., free vs. exclusive)

    const invite = await prisma.campaignInvite.create({
      data: { campaignId, creatorId, brandId, message, paymentOffer },
    });
    res.status(201).json(invite);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/brand/campaigns/invite/:inviteId/accept
 * Allows a creator to accept a campaign invitation.
 */
router.put('/campaigns/invite/:inviteId/accept', async (req, res, next) => {
  try {
    const inviteId = req.params.inviteId;
    const creatorId = getUserId(); // from auth

    const invite = await prisma.campaignInvite.update({
      where: { id: inviteId, creatorId }, // Ensure only the invited creator can accept
      data: { status: 'accepted' },
    });
    res.json(invite);
  } catch (error) {
    next(error);
  }
});

// Add routes for declining invites similarly...

export default router;