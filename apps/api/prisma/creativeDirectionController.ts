import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middleware/asyncHandler';
import { generateCreativeDirection } from '../../services/ai/creativeDirectionService';

const prisma = new PrismaClient();

// @desc    Generate or regenerate a creative pack for a campaign
// @route   POST /api/ai/campaign/creative/:campaignId
export const generateCreativePack = asyncHandler(async (req: Request, res: Response) => {
  const { campaignId } = req.params;
  const campaign = await prisma.brandCampaign.findUnique({ where: { id: campaignId } });

  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  // In a real app, you might check ownership here to ensure req.user.id === campaign.userId

  const creativePack = await generateCreativeDirection(campaign);
  res.status(201).json(creativePack);
});

// @desc    Fetch the creative pack for a campaign
// @route   GET /api/campaigns/:id/creative
export const getCreativePack = asyncHandler(async (req: Request, res: Response) => {
  const campaignId = req.params.id;
  const creativePack = await prisma.creativeDirection.findUnique({
    where: { campaignId },
  });

  if (!creativePack) {
    res.status(404);
    throw new Error('Creative direction has not been generated for this campaign yet.');
  }

  // Brand Free users can view but not generate.
  // No special filtering needed for the GET request based on current spec.

  res.status(200).json(creativePack);
});