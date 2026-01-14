import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as suitabilityService from '../services/suitabilityService';

const EvaluateSuitabilitySchema = z.object({
  creatorId: z.string().cuid(),
  brandId: z.string().cuid(),
  campaignId: z.string().cuid().optional(),
});

export async function evaluateSuitability(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = EvaluateSuitabilitySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    }
    const result = await suitabilityService.evaluateSuitability(parsed.data);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getSuitabilityHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const { creatorId } = req.params;
    const history = await suitabilityService.getSuitabilityHistory(creatorId);
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
}

export async function getSuitabilityResult(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await suitabilityService.getSuitabilityResult(id);
    if (!result) {
      return res.status(404).json({ error: "Suitability result not found." });
    }
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function explainSuitability(req: Request, res: Response, next: NextFunction) {
  try {
    const { suitabilityResultId } = req.body; // Assuming you pass the ID of a stored result
    const result = await suitabilityService.getSuitabilityResult(suitabilityResultId);
    if (!result) {
      return res.status(404).json({ error: "Suitability result not found." });
    }
    // In a real scenario, you'd pass more raw data to the explainer
    const explanation = await suitabilityService.generateSuitabilityExplanation(result, { /* raw data */ });
    res.status(200).json(explanation);
  } catch (error) {
    next(error);
  }
}