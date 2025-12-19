import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as campaignBuilderService from "../services/campaignBuilderService.js";

const GenerateCampaignSchema = z.object({
  dealId: z.string().cuid(),
  briefId: z.string().cuid(),
});

export async function generateCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = GenerateCampaignSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const campaignPlan = await campaignBuilderService.generateCampaign(parsed.data);

    res.json({ ok: true, campaign: campaignPlan });
  } catch (error) {
    next(error);
  }
}

// Other controller methods for generating individual parts (concepts, deliverables, etc.) would go here.