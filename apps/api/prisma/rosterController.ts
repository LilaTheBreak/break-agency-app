import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { getRosterForUser } from '../services/rosterService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// @desc    Get the roster based on user role and filters
// @route   GET /api/roster
export const getRoster = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const filters = req.query; // e.g., ?name=John&category=TALENT
  const roster = await getRosterForUser(user, filters);
  res.status(200).json(roster);
});

// @desc    Update a user's roster settings
// @route   POST /api/admin/roster/update/:userId
// @access  Private (Admin)
export const updateRosterSettings = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { include_in_roster, roster_category, creator_score, admin_notes } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      include_in_roster,
      roster_category,
      creator_score,
      admin_notes,
    },
  });

  res.status(200).json(updatedUser);
});