import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { filterProfileForBrand } from '../services/brandAccessService.js';

const prisma = new PrismaClient();

// @desc    Create or update a UGC listing for the current creator
// @route   POST /api/ugc/listings
// @access  Private (UGC_CREATOR)
export const upsertListing = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { title, description, rate } = req.body;

  // Find existing listing for this user
  let existing = await prisma.uGCListing.findFirst({
    where: { userId }
  });

  let listing;
  if (existing) {
    // Update existing
    listing = await prisma.uGCListing.update({
      where: { id: existing.id },
      data: {
        title: title || "My UGC Listing",
        description,
        rate
      }
    });
  } else {
    // Create new
    listing = await prisma.uGCListing.create({
      data: {
        id: `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        title: title || "My UGC Listing",
        description,
        rate,
        status: "active"
      }
    });
  }

  res.status(201).json(listing);
});

// @desc    Get and filter all approved UGC listings
// @route   GET /api/ugc/listings
// @access  Private (Brand)
export const getListings = asyncHandler(async (req: Request, res: Response) => {
  const { category, platform, priceMin, priceMax } = req.query;

  const where: any = {
    status: "active",
  };

  if (category) {
    where.portfolio = { categories: { has: category as string } };
  }

  // Add more filters for platform, price, etc. as the model evolves

  const listings = await prisma.uGCListing.findMany({
    where,
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
    where: { id: creatorId },
  });

  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  // Use the brand access service to filter the creator's profile
  const viewableProfile = filterProfileForBrand(brandUser, listing.creator);

  res.status(200).json({ ...listing, creator: viewableProfile });
});