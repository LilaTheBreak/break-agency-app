import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as campaignPlanningEngine from "../services/ai/campaignPlanningEngine.js";
import * as creatorFitEngine from "../services/ai/creatorFitEngine.js";

const CampaignPlanSchema = z.object({
  brandName: z.string(),
  goals: z.string(),
  targetAudience: z.string(),
  budget: z.number(),
});

export async function generateCampaignPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = CampaignPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }
    const plan = await campaignPlanningEngine.generateCampaignPlan(parsed.data);
    res.json(plan);
  } catch (error) {
    next(error);
  }
}

const CreatorFitSchema = z.object({
  talentId: z.string().cuid(),
  brandId: z.string().cuid(),
});

export async function computeCreatorFit(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = CreatorFitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }
    const fitScore = await creatorFitEngine.computeCreatorFit(parsed.data.talentId, parsed.data.brandId);
    res.json({ ok: true, creatorFit: fitScore });
  } catch (error) {
    next(error);
  }
}