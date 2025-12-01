import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middleware/asyncHandler';

const prisma = new PrismaClient();

// @desc    Approve a UGC listing
// @route   POST /api/admin/ugc/listings/:id/approve
// @access  Private (Admin)
export const approveListing = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const listing = await prisma.uGCListing.update({
    where: { id },
    data: { approved: true },
  });
  res.status(200).json(listing);
});

// @desc    Approve a request from a Brand Free user
// @route   POST /api/admin/ugc/requests/:id/approve
// @access  Private (Admin)
export const approveBrandRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const request = await prisma.uGCRequest.update({
    where: { id },
    data: { status: 'pending' }, // Change status from 'pending_admin_approval' to 'pending' for the creator
  });
  res.status(200).json(request);
});