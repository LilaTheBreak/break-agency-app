import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middleware/asyncHandler';

const prisma = new PrismaClient();

// @desc    Get dashboard data for the brand portal
// @route   GET /api/brand/dashboard
export const getDashboardData = asyncHandler(async (req: Request, res: Response) => {
  const brandId = req.user!.id;

  const [campaigns, requests, deliverables] = await Promise.all([
    prisma.brandCampaign.count({ where: { brandId } }),
    prisma.campaignCreatorRequest.count({ where: { brandId } }),
    prisma.deliverable.count({ where: { campaign: { brandId } } }),
  ]);

  res.status(200).json({
    user: req.user,
    stats: { campaigns, requests, deliverables },
  });
});

// @desc    Create a new brand campaign
// @route   POST /api/brand/campaigns/create
export const createCampaign = asyncHandler(async (req: Request, res: Response) => {
  const brandId = req.user!.id;
  const { title, description, budgetMin, budgetMax } = req.body;

  const campaign = await prisma.brandCampaign.create({
    data: {
      title,
      description,
      budgetMin,
      budgetMax,
      brandId,
    },
  });

  res.status(201).json(campaign);
});

// @desc    List campaigns for the brand
// @route   GET /api/brand/campaigns/list
export const listCampaigns = asyncHandler(async (req: Request, res: Response) => {
  const campaigns = await prisma.brandCampaign.findMany({
    where: { brandId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json(campaigns);
});

// @desc    Get a single campaign's details
// @route   GET /api/brand/campaigns/:id
export const getCampaignDetails = asyncHandler(async (req: Request, res: Response) => {
  const campaign = await prisma.brandCampaign.findFirst({
    where: { id: req.params.id, brandId: req.user!.id },
    include: { creatorRequests: true, deliverables: true },
  });
  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }
  res.status(200).json(campaign);
});

// @desc    Approve a deliverable for a campaign
// @route   POST /api/brand/deliverables/:id/approve
export const approveDeliverable = asyncHandler(async (req: Request, res: Response) => {
  // Add logic to ensure the brand owns the campaign associated with this deliverable
  const deliverable = await prisma.deliverable.update({
    where: { id: req.params.id },
    data: { status: 'approved', approvedAt: new Date() },
  });
  res.status(200).json(deliverable);
});