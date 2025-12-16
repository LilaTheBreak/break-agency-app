import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { getPerformanceOverview } from '../services/ai/performance/performanceOverview';
import { getRateBenchmarks } from '../services/ai/performance/rateBenchmarks';
import { getCategoryBenchmarks } from '../services/ai/performance/categoryBenchmarks';
import { getGrowthForecast } from '../services/ai/performance/growthForecast';
import { getContentInsights } from '../services/ai/performance/contentInsights';

// @desc    Get performance overview for a user
// @route   GET /api/performance/:userId/overview
export const fetchPerformanceOverview = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const data = await getPerformanceOverview(userId);
  res.status(200).json(data);
});

// @desc    Get rate benchmarks for a user
// @route   GET /api/performance/:userId/rates
export const fetchRateBenchmarks = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const data = await getRateBenchmarks(userId);
  res.status(200).json(data);
});

// @desc    Get category benchmarks for a user
// @route   GET /api/performance/:userId/category
export const fetchCategoryBenchmarks = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const data = await getCategoryBenchmarks(userId);
  res.status(200).json(data);
});

// @desc    Get growth forecast for a user
// @route   GET /api/performance/:userId/forecast
export const fetchGrowthForecast = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const data = await getGrowthForecast(userId);
  res.status(200).json(data);
});

// @desc    Get content insights for a user
// @route   GET /api/performance/:userId/content-insights
export const fetchContentInsights = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const data = await getContentInsights(userId);
  res.status(200).json(data);
});