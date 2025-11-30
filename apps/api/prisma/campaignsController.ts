import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middleware/asyncHandler'; // A utility to handle async errors
// import { aiClient } from '../../lib/aiClient'; // Assuming a shared AI client

const prisma = new PrismaClient();

// @desc    Create a new campaign
// @route   POST /api/brand/campaigns
// @access  Private (Brand)
export const createCampaign = asyncHandler(async (req: Request, res: Response) => {
  const { title, objective, budgetMin, budgetMax } = req.body;
  // const userId = req.user.id; // from auth middleware

  // --- AI INTEGRATION ---
  // const summary = await aiClient.summarize(objective);
  // const keywords = await aiClient.extractKeywords(objective);

  const campaign = await prisma.brandCampaign.create({
    data: {
      title,
      objective,
      budgetMin,
      budgetMax,
      brandId: 'clerk_user_id_placeholder', // Replace with actual user ID from auth
      // summary,
      // keywords,
    },
  });

  res.status(201).json(campaign);
});

// @desc    Get all campaigns for a brand
// @route   GET /api/brand/campaigns
// @access  Private (Brand)
export const getBrandCampaigns = asyncHandler(async (req: Request, res: Response) => {
  // const userId = req.user.id;
  const campaigns = await prisma.brandCampaign.findMany({
    where: { brandId: 'clerk_user_id_placeholder' }, // Replace with actual user ID
    orderBy: { createdAt: 'desc' },
  });
  res.json(campaigns);
});

// @desc    Get a single campaign by ID
// @route   GET /api/brand/campaigns/:id
// @access  Private (Brand)
export const getCampaignById = asyncHandler(async (req: Request, res: Response) => {
  const campaign = await prisma.brandCampaign.findUnique({
    where: { id: req.params.id },
  });

  if (campaign) {
    res.json(campaign);
  } else {
    res.status(404).send('Campaign not found');
  }
});

// @desc    Update a campaign
// @route   PUT /api/brand/campaigns/:id
// @access  Private (Brand)
export const updateCampaign = asyncHandler(async (req: Request, res: Response) => {
  // Add logic to check ownership and role
  const updatedCampaign = await prisma.brandCampaign.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(updatedCampaign);
});

// @desc    Delete a campaign
// @route   DELETE /api/brand/campaigns/:id
// @access  Private (Brand)
export const deleteCampaign = asyncHandler(async (req: Request, res: Response) => {
  // Add logic to check ownership and role
  await prisma.brandCampaign.delete({ where: { id: req.params.id } });
  res.status(204).send();
});