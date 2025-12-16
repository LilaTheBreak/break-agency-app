import { Router } from 'express';
import prisma from '../../lib/prisma.js';

const router = Router();

/**
 * POST /api/ugc/request
 * Allows a brand to send a request to a UGC creator.
 */
router.post('/request', async (req, res, next) => {
  try {
    const { creatorId, type, message, deliverables, giftDetails } = req.body;
    const brandId = 'some_brand_user_id'; // From auth

    // Add role check: only premium brands can send requests

    const request = await prisma.uGCRequest.create({
      data: { brandId, creatorId, type, message, deliverables, giftDetails },
    });
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/ugc/request/:id/accept
 * Allows a UGC creator to accept a request.
 */
router.put('/request/:id/accept', async (req, res, next) => {
  try {
    const request = await prisma.uGCRequest.update({
      where: { id: req.params.id },
      data: { status: 'accepted' },
    });
    res.json(request);
  } catch (error) {
    next(error);
  }
});

// Add routes for /decline, /sent, /received similarly...

export default router;