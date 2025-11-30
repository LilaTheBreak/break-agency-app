import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

/**
 * GET /api/asset-pack/:aiPlanId/:talentId
 * Fetches the generated asset pack for a specific talent in a campaign.
 */
router.get('/:aiPlanId/:talentId', async (req, res, next) => {
  const { aiPlanId, talentId } = req.params;
  try {
    const assetPack = await prisma.talentAssetPack.findFirst({
      where: {
        aiPlanId,
        talentId,
      },
    });
    res.json(assetPack);
  } catch (error) {
    next(error);
  }
});

// Other routes like /regenerate would be added here.

export default router;