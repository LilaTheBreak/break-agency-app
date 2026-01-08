import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { isAdmin as checkIsAdmin, isSuperAdmin } from '../lib/roleHelpers.js';

const prisma = new PrismaClient();

// @desc    A brand requests content
// @route   POST /api/ugc/request
// @access  Private (Brand)
export const createUgcRequest = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { brief, budget, deadline } = req.body;

  const request = await prisma.uGCRequest.create({
    data: {
      userId: user.id,
      brief,
      budget: budget || 0,
      deadline: deadline ? new Date(deadline) : undefined,
      status: 'pending',
    },
  });

  res.status(201).json(request);
});

// @desc    Get details of a specific UGC request
// @route   GET /api/ugc/requests/:id
// @access  Private (Brand, Admin)
export const getUgcRequest = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const requestId = req.params.id;

  const request = await prisma.uGCRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  // Visibility logic
  if (user.id !== request.userId && !checkIsAdmin(user)) {
    res.status(403);
    throw new Error('You do not have permission to view this request.');
  }

  res.status(200).json(request);
});

// @desc    Creator responds to a UGC request
// @route   POST /api/ugc/requests/:id/respond
// @access  Private (Creator)
export const respondToUgcRequest = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const requestId = req.params.id;
  const { response } = req.body;

  const request = await prisma.uGCRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  const updatedRequest = await prisma.uGCRequest.update({
    where: { id: requestId },
    data: { status: response || 'pending' },
  });

  res.status(200).json(updatedRequest);
});