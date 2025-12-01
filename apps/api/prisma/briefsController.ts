import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middleware/asyncHandler';
import { generateAiBrief } from '../../services/aiBriefBuilderService';
import { isPremiumBrand, assertPremium } from '../../services/brandAccessService';

const prisma = new PrismaClient();

// @desc    Generate a campaign brief using AI
// @route   POST /api/briefs/ai-generate
// @access  Private (Brand Premium)
export const createAiBrief = asyncHandler(async (req: Request, res: Response) => {
  const brandUser = req.user!;
  assertPremium(brandUser); // Throws 402 if not premium

  // In a real app, you might check a monthly usage limit for free users if they had access

  const briefInputs = req.body;
  const generatedBrief = await generateAiBrief(briefInputs, brandUser.id);

  res.status(201).json(generatedBrief);
});

// @desc    Generate a campaign brief from a template
// @route   POST /api/briefs/template-generate
// @access  Private (Brand)
export const createBriefFromTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { templateId } = req.body;
  const template = await prisma.campaignTemplate.findUnique({ where: { id: templateId } });

  if (!template) {
    res.status(404);
    throw new Error('Template not found');
  }

  // Logic to create a new BrandBrief based on the template structure
  // For now, we'll return a mock response
  res.status(201).json({ message: `Brief created from template: ${template.title}`, template });
});

// @desc    Get a specific brief by ID
// @route   GET /api/briefs/:id
// @access  Private (Brand)
export const getBriefById = asyncHandler(async (req: Request, res: Response) => {
  const brief = await prisma.brandBrief.findUnique({
    where: { id: req.params.id },
    include: { autoPlans: true },
  });

  if (!brief) {
    res.status(404);
    throw new Error('Brief not found');
  }

  // Add ownership check here

  res.status(200).json(brief);
});

// @desc    Update a brief
// @route   PUT /api/briefs/:id
// @access  Private (Brand)
export const updateBrief = asyncHandler(async (req: Request, res: Response) => {
  const updatedBrief = await prisma.brandBrief.update({
    where: { id: req.params.id },
    data: req.body, // Simplified update
  });
  res.status(200).json(updatedBrief);
});