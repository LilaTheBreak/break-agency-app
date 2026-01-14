import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { searchCreativeAssets, rankSearchResults } from '../services/creativeHubService.js';

// @desc    Search for creative assets
// @route   GET /api/creative-hub/search
export const searchHub = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const filters = req.query;

  const results = await searchCreativeAssets(user, filters);

  res.status(200).json(results);
});

// @desc    Re-rank search results using AI
// @route   POST /api/creative-hub/rank
export const rankHubResults = asyncHandler(async (req: Request, res: Response) => {
  const { results, query } = req.body;

  if (!results || !Array.isArray(results)) {
    res.status(400).json({ error: 'A "results" array is required.' });
  }

  const rankedResults = await rankSearchResults(results, query);
  res.status(200).json(rankedResults);
});