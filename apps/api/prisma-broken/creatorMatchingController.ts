import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middleware/asyncHandler';
import { generateMatchesForBrief } from '../../services/ai/creatorMatchingService';

const prisma = new PrismaClient();

// @desc    Trigger the AI matching engine for a brief
// @route   POST /api/ai/creator-matching/generate
export const runMatchingEngine = asyncHandler(async (req: Request, res: Response) => {
  const { briefId } = req.body;
  const brief = await prisma.brandBrief.findUnique({ where: { id: briefId } });

  if (!brief) {
    res.status(404);
    throw new Error('Brief not found');
  }

  const matches = await generateMatchesForBrief(brief);
  res.status(200).json(matches);
});

// @desc    Get matches for a specific brief, with role-based filtering
// @route   GET /api/brand/briefs/:id/matches
export const getBriefMatches = asyncHandler(async (req: Request, res: Response) => {
  const briefId = req.params.id;
  const brand = req.user!;

  let matches = await prisma.creatorMatchScore.findMany({
    where: { briefId },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, roster_category: true } },
    },
    orderBy: { fitScore: 'desc' },
  });

  // Apply business rules based on subscription status
  if (brand.subscriptionStatus === 'free') {
    // Filter for VIP and UGC only
    matches = matches.filter(m => m.user.roster_category === 'UGC' || m.user.roster_category === 'VIP');
    // Limit to top 3
    matches = matches.slice(0, 3);
    // Blur sensitive data for high-fit creators
    matches = matches.map(m => {
      if (m.fitScore > 80) {
        return {
          ...m,
          predictedFee: null,
          predictedViews: null,
          reasoning: { blurred: 'Upgrade to Premium to see detailed reasoning.' },
        };
      }
      return m;
    });
  }

  res.status(200).json(matches);
});

// @desc    Get all match scores for a specific creator (for admin/internal use)
// @route   GET /api/ai/creator-matching/:creatorId
export const getMatchesForCreator = asyncHandler(async (req: Request, res: Response) => {
  const matches = await prisma.creatorMatchScore.findMany({
    where: { userId: req.params.creatorId },
    include: { brief: { select: { title: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json(matches);
});