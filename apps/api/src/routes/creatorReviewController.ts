import { Request, Response } from 'express';
import { PrismaClient, UserRoleType } from '@prisma/client';
import { asyncHandler } from '../../middleware/asyncHandler';

const prisma = new PrismaClient();

// @desc    List all users pending review
// @route   GET /api/admin/creator-reviews
// @access  Private (Admin)
export const getPendingReviews = asyncHandler(async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    where: {
      onboarding_status: 'pending_review',
      role: { notIn: ['ADMIN', 'SUPER_ADMIN'] },
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      creator_score: true,
      creator_score_reason: true,
      role_recommended: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
  res.json(users);
});

// @desc    Approve a creator's onboarding
// @route   POST /api/admin/creator-reviews/:id/approve
// @access  Private (Admin)
export const approveCreator = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { final_role } = req.body;

  const userToApprove = await prisma.user.findUnique({ where: { id } });
  if (!userToApprove) {
    res.status(404);
    throw new Error('User not found');
  }

  const roleToSet = (final_role || userToApprove.role_recommended || 'TALENT') as UserRoleType;

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      onboarding_status: 'approved',
      role: roleToSet,
    },
  });

  res.status(200).json(updatedUser);
});

// @desc    Override a creator's role and add notes
// @route   POST /api/admin/creator-reviews/:id/override
// @access  Private (Admin)
export const overrideCreatorRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { new_role, notes } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      role: new_role as UserRoleType,
      admin_notes: notes,
      onboarding_status: 'approved', // Overriding also approves the user
    },
  });

  res.status(200).json(updatedUser);
});