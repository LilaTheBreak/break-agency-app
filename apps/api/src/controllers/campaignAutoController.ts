import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as campaignAutoPlanService from '../services/campaignAutoPlanService';

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

    return res.json({ ok: true, campaignId: autoPlan.campaignId, autoPlan });
  } catch (error) {
    next(error);
  }
}

export async function previewAutoPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const enabled = process.env.CAMPAIGN_AUTOPLAN_ENABLED === "true";
    if (!enabled) {
      return res.status(503).json({
        ok: false,
        error: "Campaign auto-plan feature is disabled",
        message: "This feature is currently disabled. Contact an administrator to enable it.",
        code: "FEATURE_DISABLED"
      });
    }

    const parsed = AutoPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid payload", details: parsed.error.flatten() });
    }

    // Phase 5: Generate preview without persisting
    const preview = await campaignAutoPlanService.autoPlanCampaign({
      ...parsed.data,
      userId: req.user!.id,
      preview: true // Flag to indicate preview mode
    });

    return res.json({ ok: true, preview });
  } catch (error) {
    next(error);
  }
}

export async function debugAutoPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const enabled = process.env.CAMPAIGN_AUTOPLAN_ENABLED === "true";
    if (!enabled) {
      return res.status(503).json({
        ok: false,
        error: "Campaign auto-plan feature is disabled",
        message: "This feature is currently disabled. Contact an administrator to enable it.",
        code: "FEATURE_DISABLED"
      });
    }

    // Admin only for debug endpoint
    if (req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPERADMIN') {
      return res.status(403).json({
        ok: false,
        error: "Forbidden",
        message: "Debug endpoint is admin-only"
      });
    }

    const parsed = AutoPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid payload", details: parsed.error.flatten() });
    }

    // Phase 5: Generate debug output with raw LLM response
    const debug = await campaignAutoPlanService.autoPlanCampaign({
      ...parsed.data,
      userId: req.user!.id,
      debug: true // Flag to return raw LLM output
    });

    return res.json({ ok: true, debug });
  } catch (error) {
    next(error);
  }
}