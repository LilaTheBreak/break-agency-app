import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';

const prisma = new PrismaClient();

// --- Brand-Facing Controllers ---

// @desc    Create a new talent request
// @route   POST /api/brand/talent-requests
export const createTalentRequest = asyncHandler(async (req: Request, res: Response) => {
  const brand = req.user!;
  const { talentId, campaignId, deliverables, budgetMin, budgetMax, timeline, notes } = req.body;

  const talentUser = await prisma.user.findUnique({ where: { id: talentId } });
  if (!talentUser) {
    res.status(404);
    throw new Error('Talent not found.');
  }

  // Business Rule: Brand Free can only request UGC or VIP creators
  if (brand.subscriptionStatus === 'free' && talentUser.roster_category !== 'UGC' && talentUser.roster_category !== 'VIP') {
    res.status(403);
    throw new Error('Upgrade to Premium to request this tier of talent.');
  }

  const request = await prisma.talentRequest.create({
    data: {
      brandId: brand.id,
      talentId,
      campaignId,
      deliverables,
      budgetMin,
      budgetMax,
      timeline,
      notes,
    },
  });

  // Notify admins/managers
  // await emailService.send({ to: 'info@thebreakco.com', subject: `New Talent Request for ${talentUser.name}` });
  // await slackClient.send({ message: `New talent request from ${brand.name} for ${talentUser.name}` });

  res.status(201).json(request);
});

// @desc    List talent requests sent by the current brand
// @route   GET /api/brand/talent-requests
export const listMySentRequests = asyncHandler(async (req: Request, res: Response) => {
  const requests = await prisma.talentRequest.findMany({
    where: { brandId: req.user!.id },
    include: { talent: { select: { user: { select: { name: true, avatarUrl: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json(requests);
});

// --- Admin-Facing Controllers ---

// @desc    List all talent requests for admin review
// @route   GET /api/admin/talent-requests
export const listAllTalentRequests = asyncHandler(async (req: Request, res: Response) => {
  const requests = await prisma.talentRequest.findMany({
    where: { status: 'pending' },
    include: {
      brand: { select: { name: true } },
      talent: { select: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.status(200).json(requests);
});

// @desc    Approve a talent request (manager approval)
// @route   POST /api/admin/talent-requests/:id/approve
export const approveTalentRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await prisma.talentRequest.update({
    where: { id: req.params.id },
    data: { status: 'manager_approved' },
  });
  // Notify creator that they have a new request to review
  res.status(200).json(request);
});

// --- Creator-Facing Controllers ---

// @desc    List incoming requests for the current creator
// @route   GET /api/creator/requests
export const listMyIncomingRequests = asyncHandler(async (req: Request, res: Response) => {
  const requests = await prisma.talentRequest.findMany({
    where: {
      talentId: req.user!.id,
      status: 'manager_approved', // Only show requests approved by a manager
    },
    include: { brand: { select: { name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json(requests);
});

// @desc    Creator responds to a talent request
// @route   POST /api/creator/requests/:id/respond
export const respondToTalentRequest = asyncHandler(async (req: Request, res: Response) => {
  const { response } = req.body; // 'accepted' or 'declined'
  const validResponses = ['accepted', 'declined'];
  if (!validResponses.includes(response)) {
    res.status(400);
    throw new Error('Invalid response.');
  }

  const request = await prisma.talentRequest.findFirst({
    where: { id: req.params.id, talentId: req.user!.id },
  });

  if (!request) {
    res.status(404);
    throw new Error('Request not found or you do not have permission to respond.');
  }

  const updatedRequest = await prisma.talentRequest.update({
    where: { id: req.params.id },
    data: { status: response === 'accepted' ? 'creator_approved' : 'creator_declined' },
  });

  res.status(200).json(updatedRequest);
});