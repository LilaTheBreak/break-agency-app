import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middleware/asyncHandler';
import { generateCreatorBundles } from '../../services/ai/bundleBuilderService';

const prisma = new PrismaClient();

// @desc    Generate creator bundles for a brief
// @route   POST /api/ai/bundles/generate/:briefId
export const generateBundles = asyncHandler(async (req: Request, res: Response) => {
  const { briefId } = req.params;
  const brief = await prisma.brandBrief.findUnique({ where: { id: briefId } });

  if (!brief) {
    res.status(404);
    throw new Error('Brief not found');
  }

  const bundles = await generateCreatorBundles(brief);
  res.status(201).json(bundles);
});

// @desc    Get creator bundles for a brand's brief
// @route   GET /api/brand/briefs/:id/bundles
export const getBriefBundles = asyncHandler(async (req: Request, res: Response) => {
  const briefId = req.params.id;
  const brand = req.user!;

  const bundles = await prisma.creatorBundle.findMany({
    where: { briefId },
    orderBy: { type: 'asc' },
  });

  // Brand Free users can only see the first bundle
  if (brand.subscriptionStatus === 'free') {
    const unlockedBundle = bundles.slice(0, 1);
    const lockedBundles = bundles.slice(1).map(b => ({
      ...b,
      creators: [],
      budget: null,
      forecast: null,
      aiSummary: 'Upgrade to Premium to unlock this strategic creator bundle.',
      locked: true,
    }));
    return res.status(200).json([...unlockedBundle, ...lockedBundles]);
  }

  res.status(200).json(bundles);
});

// @desc    Convert a bundle into an actionable campaign plan
// @route   POST /api/ai/bundles/:id/convert-to-plan
export const convertBundleToPlan = asyncHandler(async (req: Request, res: Response) => {
  // Logic to create a Campaign, Deliverables, and CampaignCreatorRequests from a bundle
  res.status(501).json({ message: 'Conversion to plan not yet implemented.' });
});