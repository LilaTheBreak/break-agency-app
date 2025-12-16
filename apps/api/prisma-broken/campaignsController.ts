import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middleware/asyncHandler';
import { parseCampaignBrief } from '../../services/ai/campaigns/aiParser';
import { findCreatorMatches } from '../../services/ai/campaigns/creatorMatching';
// import { emailQueue } from '../../worker/queues';
// import { slackClient } from '../../integrations/slack/slackClient';

const prisma = new PrismaClient();

// @desc    Create a new brand campaign
// @route   POST /api/brand-campaigns
export const createCampaign = asyncHandler(async (req: Request, res: Response) => {
  const brandUser = req.user!;
  const campaignInput = req.body;

  // 1. Run AI Parser to enrich the brief
  const aiInsights = await parseCampaignBrief(campaignInput);

  // 2. Create the campaign record with AI insights
  const newCampaign = await prisma.brandCampaign.create({
    data: {
      ...campaignInput,
      brandId: brandUser.id,
      brandName: brandUser.name,
      submittedBy: brandUser.email,
      ...aiInsights,
    },
  });

  // 3. Run Creator Matching asynchronously (or in a queue)
  const matches = await findCreatorMatches(newCampaign);
  const updatedCampaign = await prisma.brandCampaign.update({
    where: { id: newCampaign.id },
    data: { aiCreatorMatches: matches as any },
  });

  // 4. Send notifications
  // await emailQueue.add('new-campaign-submitted', { campaignId: newCampaign.id });
  // await slackClient.sendSlackAlert(`New campaign submitted: "${newCampaign.title}"`);

  res.status(201).json(updatedCampaign);
});

// @desc    Get all campaigns for the current brand
// @route   GET /api/brand-campaigns
export const getBrandCampaigns = asyncHandler(async (req: Request, res: Response) => {
  const campaigns = await prisma.brandCampaign.findMany({
    where: { brandId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json(campaigns);
});

// @desc    Get a single campaign by ID
// @route   GET /api/brand-campaigns/:id
export const getCampaignById = asyncHandler(async (req: Request, res: Response) => {
  const campaign = await prisma.brandCampaign.findFirst({
    where: { id: req.params.id, brandId: req.user!.id }, // Ensure ownership
  });
  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }
  res.status(200).json(campaign);
});

// @desc    Update a campaign
// @route   PUT /api/brand-campaigns/:id
export const updateCampaign = asyncHandler(async (req: Request, res: Response) => {
  // Add ownership check before updating
  const campaign = await prisma.brandCampaign.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.status(200).json(campaign);
});