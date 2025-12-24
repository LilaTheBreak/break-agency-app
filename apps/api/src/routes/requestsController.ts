import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { isPremiumBrand } from '../../services/brandAccessService.js';
import { isAdmin as checkIsAdmin, isSuperAdmin } from '../../lib/roleHelpers.js';

const prisma = new PrismaClient();
const BRAND_FREE_REQUEST_LIMIT = 3;

// @desc    A brand requests content from a UGC creator
// @route   POST /api/ugc/request
// @access  Private (Brand)
export const createUgcRequest = asyncHandler(async (req: Request, res: Response) => {
  const brandUser = req.user!;
  const { creatorId, type, message, brief, deliverables } = req.body;

  // Enforce monthly cap for Brand Free users
  if (!isPremiumBrand(brandUser)) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const requestCount = await prisma.uGCRequest.count({
      where: {
        brandId: brandUser.id,
        createdAt: { gte: startOfMonth },
      },
    });

    if (requestCount >= BRAND_FREE_REQUEST_LIMIT) {
      res.status(403);
      throw new Error('You have reached your monthly limit for UGC requests. Please upgrade to Premium.');
    }
  }

  const request = await prisma.uGCRequest.create({
    data: {
      brandId: brandUser.id,
      creatorId,
      type,
      message,
      // In a real app, brief and deliverables would be more structured
      deliverables: { brief, items: deliverables },
      status: isPremiumBrand(brandUser) ? 'pending' : 'pending_admin_approval',
    },
  });

  res.status(201).json(request);
});

// @desc    Get details of a specific UGC request
// @route   GET /api/ugc/requests/:id
// @access  Private (Brand, Creator, Admin)
export const getUgcRequest = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const requestId = req.params.id;

  const request = await prisma.uGCRequest.findUnique({
    where: { id: requestId },
    include: { brand: true, creator: true },
  });

  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  // Visibility logic
  if (user.id !== request.brandId && user.id !== request.creatorId && !checkIsAdmin(user)) {
    res.status(403);
    throw new Error('You do not have permission to view this request.');
  }

  res.status(200).json(request);
});

// @desc    A creator responds to a UGC request
// @route   POST /api/ugc/requests/:id/respond
// @access  Private (Creator)
export const respondToUgcRequest = asyncHandler(async (req: Request, res: Response) => {
  const creatorId = req.user!.id;
  const requestId = req.params.id;
  const { response } = req.body; // 'accept', 'decline', 'revise'

  const request = await prisma.uGCRequest.findFirst({
    where: { id: requestId, creatorId },
  });

  if (!request) {
    res.status(404);
    throw new Error('Request not found or you do not have permission to respond.');
  }

  const updatedRequest = await prisma.uGCRequest.update({
    where: { id: requestId },
    data: { status: response }, // e.g., 'accepted', 'declined'
  });

  res.status(200).json(updatedRequest);
});