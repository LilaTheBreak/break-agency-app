import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as campaignAutoPlanService from "../services/campaignAutoPlanService";

const AutoPlanSchema = z.object({
  dealId: z.string().cuid().optional(),
  briefId: z.string().cuid().optional(),
}).refine(data => data.dealId || data.briefId, {
  message: "Either dealId or briefId must be provided.",
});

export async function autoPlanCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = AutoPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid payload", details: parsed.error.flatten() });
    }

    const autoPlan = await campaignAutoPlanService.autoPlanCampaign({
      ...parsed.data,
      userId: req.user!.id,
    });

    res.json({ ok: true, campaignId: autoPlan.campaignId, autoPlan });
  } catch (error) {
    next(error);
  }
}

export async function previewAutoPlan(req: Request, res: Response, next: NextFunction) {
  // This would typically call the autoPlanCampaign service but not persist the result,
  // or use a dedicated preview function in the service.
  res.status(501).json({ ok: false, error: "Preview not implemented yet." });
}

export async function debugAutoPlan(req: Request, res: Response, next: NextFunction) {
  // This would return raw LLM output for debugging purposes.
  res.status(501).json({ ok: false, error: "Debug not implemented yet." });
}