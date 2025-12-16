import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middleware/asyncHandler';
import { filterProfileForBrand } from '../../services/brandAccessService';

const prisma = new PrismaClient();

// @desc    Get the main data for the brand discovery homepage
// @route   GET /api/brand/discovery
// @access  Private (Brand)
export const getDiscoveryHomepage = asyncHandler(async (req: Request, res: Response) => {
  const [recommendedCreators, vip, trendingCreators, newUGC, categories] = await Promise.all([
    // Mock recommended creators
    prisma.user.findMany({
      where: { creator_score: { gt: 80 }, include_in_roster: true },
      take: 5,
      select: { id: true, name: true, avatarUrl: true, roster_category: true },
    }),
    // Get VIPs from Friends of House
    prisma.friendOfHouse.findMany({ take: 5 }),
    // Mock trending creators
    prisma.user.findMany({
      where: { creator_score: { gt: 75 }, include_in_roster: true },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, name: true, avatarUrl: true, roster_category: true },
    }),
    // Get newest approved UGC listings
    prisma.uGCLisiting.findMany({
      where: { approved: true, visibility: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { creator: { select: { id: true, name: true, avatarUrl: true } } },
    }),
    // Get distinct categories
    prisma.user.findMany({
        where: { ugc_categories: { isEmpty: false } },
        select: { ugc_categories: true },
        take: 100,
    }).then(users => [...new Set(users.flatMap(u => u.ugc_categories))].slice(0, 10)),
  ]);

  res.status(200).json({ recommendedCreators, vip, trendingCreators, newUGC, categories });
});

// @desc    Filter and search for creators
// @route   POST /api/brand/discovery/filter
// @access  Private (Brand)
export const filterCreators = asyncHandler(async (req: Request, res: Response) => {
  const { platforms, categories, roster, engagement, audience } = req.body;

  // Build a dynamic where clause for Prisma
  const where: any = {
    include_in_roster: true,
  };

  if (categories?.length > 0) {
    where.ugc_categories = { hasSome: categories };
  }

  if (roster?.length > 0) {
    where.roster_category = { in: roster };
  }

  // More complex filters for engagement/audience would join on SocialAnalytics

  const matchedUsers = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      roster_category: true,
      creator_score: true,
    },
    orderBy: {
      creator_score: 'desc', // Simple ranking by score
    },
    take: 50,
  });

  res.status(200).json(matchedUsers);
});

// @desc    Get a specific creator's profile
// @route   GET /api/brand/discovery/profile/:creatorId
// @access  Private (Brand)
export const getCreatorProfile = asyncHandler(async (req: Request, res: Response) => {
  const { creatorId } = req.params;
  const brandUser = req.user!;

  const creatorProfile = await prisma.user.findUnique({
    where: { id: creatorId },
    include: {
      socialAccounts: {
        select: { platform: true, username: true, followers: true, profileUrl: true },
      },
      ugcPortfolio: true,
    },
  });

  if (!creatorProfile) {
    res.status(404);
    throw new Error('Creator not found.');
  }

  // Filter the profile based on the brand's subscription status
  const viewableProfile = filterProfileForBrand(brandUser, creatorProfile);

  res.status(200).json(viewableProfile);
});