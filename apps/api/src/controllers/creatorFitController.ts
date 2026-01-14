/**
 * Creator Fit Scoring Controller - TRANSPARENT VERSION
 * Replaces AI-based fit scoring with transparent, explainable calculations
 */

import type { Request, Response, NextFunction } from "express";
import * as fitScoringService from '../services/creatorFitScoringService.js';

/**
 * POST /api/creator-fit/calculate
 * Calculate transparent fit score for a single creator-brand pair
 */
export async function calculateCreatorFit(req: Request, res: Response, next: NextFunction) {
  try {
    const { talentId, brandId, saveToDatabase } = req.body;

    if (!talentId || !brandId) {
      return res.status(400).json({ error: "talentId and brandId are required" });
    }

    const fitScore = await fitScoringService.calculateFitScore(talentId, brandId);

    // Optionally save to database
    if (saveToDatabase) {
      await fitScoringService.saveFitScore(brandId, talentId, null, fitScore);
    }

    res.json({ ok: true, fitScore });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/creator-fit/batch
 * Calculate fit scores for multiple creators with a single brand
 */
export async function calculateBatchFit(req: Request, res: Response, next: NextFunction) {
  try {
    const { brandId, talentIds, saveToDatabase } = req.body;

    if (!brandId || !talentIds || !Array.isArray(talentIds)) {
      return res.status(400).json({ error: "brandId and talentIds array are required" });
    }

    const results = await fitScoringService.calculateBatchFitScores(brandId, talentIds);

    // Optionally save to database
    if (saveToDatabase) {
      for (const result of results) {
        await fitScoringService.saveFitScore(brandId, result.talentId, null, {
          totalScore: result.totalScore,
          audienceScore: result.audienceScore,
          engagementScore: result.engagementScore,
          historyScore: result.historyScore,
          categoryScore: result.categoryScore,
          explanation: result.explanation,
          calculationDetails: result.calculationDetails
        });
      }
    }

    res.json({ ok: true, results });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/creator-fit/talent/:talentId
 * Get all saved fit scores for a talent
 */
export async function fetchTalentFit(req: Request, res: Response, next: NextFunction) {
  try {
    const { talentId } = req.params;
    const scores = await fitScoringService.getTalentFitScores(talentId);
    res.json({ ok: true, scores });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/creator-fit/brand/:brandId
 * Get all saved fit scores for a brand
 */
export async function fetchBrandFit(req: Request, res: Response, next: NextFunction) {
  try {
    const { brandId } = req.params;
    const scores = await fitScoringService.getBrandFitScores(brandId);
    res.json({ ok: true, scores });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/creator-fit/save
 * Save a calculated fit score to database
 */
export async function saveFitScore(req: Request, res: Response, next: NextFunction) {
  try {
    const { brandId, talentId, campaignId, fitScore } = req.body;

    if (!brandId || !talentId || !fitScore) {
      return res.status(400).json({ error: "brandId, talentId, and fitScore are required" });
    }

    await fitScoringService.saveFitScore(brandId, talentId, campaignId || null, fitScore);
    res.json({ ok: true, message: "Fit score saved" });
  } catch (error) {
    next(error);
  }
}