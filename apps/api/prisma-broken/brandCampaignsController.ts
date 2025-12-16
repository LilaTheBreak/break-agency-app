import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middleware/asyncHandler';

const prisma = new PrismaClient();
const BRAND_FREE_CAMPAIGN_LIMIT = 1;

// @desc    Create a new brand campaign
// @route   POST /api/brand/campaigns
export const createBrandCampaign = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;

  // Enforce campaign limit for Brand Free users
  if (user.subscriptionStatus === 'free') {
    const campaignCount = await prisma.brandCampaign.count({ where: { userId: user.id } });
    if (campaignCount >= BRAND_FREE_CAMPAIGN_LIMIT) {
      res.status(402); // Payment Required
      throw new Error(`Free plan is limited to ${BRAND_FREE_CAMPAIGN_LIMIT} campaign. Please upgrade to Premium.`);
    }
  }

  const { title, description, goals, categories, budgetMin, budgetMax } = req.body;

  const campaign = await prisma.brandCampaign.create({
    data: {
      userId: user.id,
      title,
      description,
      goals,
      categories,
      budgetMin,
      budgetMax,
      status: 'submitted',
      // fileId can be added here if a file upload service is used
    },
  });

  // Notify admins
  // await emailService.send({ to: 'info@thebreakco.com', subject: `New Campaign: ${title}` });
  // await slackClient.send({ message: `New campaign submitted by ${user.name}: "${title}"` });

  res.status(201).json(campaign);
});

// @desc    List campaigns for the current brand
// @route   GET /api/brand/campaigns
export const listMyCampaigns = asyncHandler(async (req: Request, res: Response) => {
  const campaigns = await prisma.brandCampaign.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json(campaigns);
});

// @desc    Get a single campaign by ID
// @route   GET /api/brand/campaigns/:id
export const getMyCampaignById = asyncHandler(async (req: Request, res: Response) => {
  const campaign = await prisma.brandCampaign.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });

  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }
  res.status(200).json(campaign);
});

// --- Admin Routes ---

// @desc    List all brand campaigns for admin
// @route   GET /api/admin/brand-campaigns
export const listAllCampaigns = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;
  const where: any = {};
  if (status) {
    where.status = status as string;
  }

  const campaigns = await prisma.brandCampaign.findMany({
    where,
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json(campaigns);
});

// @desc    Get any campaign by ID for admin
// @route   GET /api/admin/brand-campaigns/:id
export const getAnyCampaignById = asyncHandler(async (req: Request, res: Response) => {
  const campaign = await prisma.brandCampaign.findUnique({
    where: { id: req.params.id },
    include: { user: true },
  });
  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }
  res.status(200).json(campaign);
});

// @desc    Review and update a campaign as admin
// @route   POST /api/admin/brand-campaigns/:id/review
export const reviewCampaign = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const campaign = await prisma.brandCampaign.update({
    where: { id },
    data: {
      status,
      notes, // Assuming 'notes' is for admin feedback
    },
  });

  // Notify brand of status update
  // await emailService.send({ to: campaign.user.email, ... });

  res.status(200).json(campaign);
});