import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { DealStage } from "@prisma/client";
import * as dealService from "../services/deals/dealService.js";
import * as dealWorkflowService from "../services/deals/dealWorkflowService.js";
import { getEffectiveUserId, blockAdminActionsWhileImpersonating } from "../lib/dataScopingHelpers.js";

const DealCreateSchema = z.object({
  talentId: z.string().cuid(),
  brandName: z.string().min(1),
  value: z.number().positive().optional(),
  brief: z.string().optional()
});

export async function createDeal(req: Request, res: Response, next: NextFunction) {
  try {
    // Block admin actions while impersonating
    blockAdminActionsWhileImpersonating(req);
    
    // Use effective user ID (respects impersonation context)
    const effectiveUserId = getEffectiveUserId(req);
    
    const parsed = DealCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }
    // SECURITY FIX: Verify talentId matches effective user
    if (parsed.data.talentId !== effectiveUserId) {
      return res.status(403).json({ error: "Cannot create deals for other users while impersonating" });
    }
    // TODO: Implement createDeal in dealService - for now just return the input
    return res.status(201).json({ ok: false, error: "Create deal not yet implemented" });
  } catch (error) {
    next(error);
  }
}

export async function listDeals(req: Request, res: Response, next: NextFunction) {
  try {
    // Use effective user ID (respects impersonation context)
    const effectiveUserId = getEffectiveUserId(req);
    const deals = await dealService.getAllDeals(effectiveUserId);
    return res.json(deals);
  } catch (error) {
    next(error);
  }
}

export async function getDeal(req: Request, res: Response, next: NextFunction) {
  try {
    // Use effective user ID (respects impersonation context)
    const effectiveUserId = getEffectiveUserId(req);
    const deal = await dealService.getDealById(req.params.id, effectiveUserId);
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }
    return res.json(deal);
  } catch (error) {
    next(error);
  }
}

const DealUpdateSchema = z.object({
  stage: z.nativeEnum(DealStage).optional(),
  value: z.number().positive().optional(),
  notes: z.string().optional(),
  talentId: z.string().cuid().optional(),
  contractId: z.string().optional(),
  expectedClose: z.string().datetime().optional()
});

export async function updateDeal(req: Request, res: Response, next: NextFunction) {
  try {
    // Block admin actions while impersonating
    blockAdminActionsWhileImpersonating(req);
    
    const parsed = DealUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }
    // TODO: Implement updateDeal in dealService
    return res.json({ ok: false, error: "Update deal not yet implemented" });
  } catch (error) {
    next(error);
  }
}

export async function deleteDeal(req: Request, res: Response, next: NextFunction) {
  try {
    // Block admin actions while impersonating
    blockAdminActionsWhileImpersonating(req);
    
    // Use effective user ID (respects impersonation context)
    const effectiveUserId = getEffectiveUserId(req);
    const success = await dealService.deleteDeal(req.params.id, effectiveUserId);
    if (!success) {
      return res.status(404).json({ error: "Deal not found or insufficient permissions" });
    }
    // Always return 200 with JSON - never 204 No Content
    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}

const StageChangeSchema = z.object({
  stage: z.nativeEnum(DealStage)
});

export async function changeDealStage(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = StageChangeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid stage provided", details: parsed.error.flatten() });
    }

    const result = await dealWorkflowService.changeStage(
      req.params.id,
      parsed.data.stage,
      req.user!.id
    );

    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.json(result.deal);
  } catch (error) {
    next(error);
  }
}