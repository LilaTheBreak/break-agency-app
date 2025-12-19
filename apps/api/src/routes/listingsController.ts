import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { filterProfileForBrand } from '../../services/brandAccessService.js';

const prisma = new PrismaClient();

// @desc    Create or update a UGC listing for the current creator
// @route   POST /api/ugc/listings
// @access  Private (UGC_CREATOR)
export const upsertListing = asyncHandler(async (req: Request, res: Response) => {
  const creatorId = req.user!.id;
  const { portfolio, categories, deliverables, priceRange, turnaround } = req.body;

  const listing = await prisma.uGCListing.upsert({
    where: { creatorId },
    create: {
      creatorId,
      // These fields would be on the UGCListing model
      // For now, storing in the portfolio which is more flexible
      portfolio: {
        upsert: {
          where: { userId: creatorId },
          create: { userId: creatorId, bio: req.body.bio, sampleLinks: portfolio, categories },
          update: { bio: req.body.bio, sampleLinks: portfolio, categories },
        },
      },
    },
    update: {
      portfolio: {
        update: {
          where: { userId: creatorId },
          data: { bio: req.body.bio, sampleLinks: portfolio, categories },
        },
      },
    },
    include: { portfolio: true },
  });

  res.status(201).json(listing);
});

// @desc    Get and filter all approved UGC listings
// @route   GET /api/ugc/listings
// @access  Private (Brand)
export const getListings = asyncHandler(async (req: Request, res: Response) => {
  const { category, platform, priceMin, priceMax } = req.query;

  const where: any = {
    approved: true,
    visibility: true,
  };

  if (category) {
    where.portfolio = { categories: { has: category as string } };
  }

  // Add more filters for platform, price, etc. as the model evolves

  const listings = await prisma.uGCListing.findMany({
    where,
    include: {
      creator: { select: { id: true, name: true, avatarUrl: true } },
      portfolio: true,
    },
    take: 50,
  });

  res.status(200).json(listings);
});

// @desc    Get a single UGC listing by creator ID
// @route   GET /api/ugc/listings/:id
// @access  Private (Brand)
export const getListingById = asyncHandler(async (req: Request, res: Response) => {
  const brandUser = req.user!;
  const creatorId = req.params.id;

  const listing = await prisma.uGCListing.findUnique({
    where: { creatorId },
    include: {
      creator: {
        include: {
          socialAccounts: true,
        },
      },
      portfolio: true,
    },
  });

  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  // Use the brand access service to filter the creator's profile
  const viewableProfile = filterProfileForBrand(brandUser, listing.creator);

  res.status(200).json({ ...listing, creator: viewableProfile });
});