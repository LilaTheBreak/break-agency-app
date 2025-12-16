import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { generateCampaignForecast } from '../services/ai/campaignForecastService';

const prisma = new PrismaClient();

// @desc    Manually trigger a forecast generation for a brief
// @route   POST /api/campaigns/forecast/:briefId
export const triggerForecastGeneration = asyncHandler(async (req: Request, res: Response) => {
  const { briefId } = req.params;
  const forecast = await generateCampaignForecast(briefId);
  res.status(201).json(forecast);
});

// @desc    Get the forecast for a specific brief
// @route   GET /api/campaigns/forecast/brief/:briefId
export const getForecastForBrief = asyncHandler(async (req: Request, res: Response) => {
  const { briefId } = req.params;
  const forecast = await prisma.campaignForecast.findUnique({
    where: { briefId },
  });
  if (!forecast) {
    res.status(404);
    throw new Error('Forecast not found for this brief.');
  }
  res.status(200).json(forecast);
});

// @desc    Get all forecasts for a specific brand (user)
// @route   GET /api/campaigns/forecast/brand/:brandId
export const getForecastsForBrand = asyncHandler(async (req: Request, res: Response) => {
  const { brandId } = req.params;
  // Add permission check to ensure user can view these forecasts
  const forecasts = await prisma.campaignForecast.findMany({
    where: { userId: brandId },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json(forecasts);
});