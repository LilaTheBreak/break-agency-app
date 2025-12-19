import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as outreachAIService from "../services/ai/outreachAIService.js";

const GenerateLeadsSchema = z.object({
  niche: z.string().min(2),
  count: z.number().int().min(1).max(50).optional(),
});

/**
 * Generates a list of prospect leads using AI.
 */
export async function generateLeads(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = GenerateLeadsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid payload", details: parsed.error.flatten() });
    }

    console.log("generateLeads called with niche:", parsed.data.niche);
    const leads = await outreachAIService.generateLeadProspects(req.user, parsed.data.niche, parsed.data.count);

    return res.json({ ok: true, data: leads });
  } catch (err) {
    console.error("Error in generateLeads", err);
    next(err);
  }
}

/**
 * Lists existing outreach leads.
 */
export async function listLeads(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("listLeads called for user:", req.user!.id);
    // TODO: Replace with real logic
    // const leads = await prisma.outreachLead.findMany({ where: { userId: req.user!.id } });

    return res.json({ ok: true, data: [] });
  } catch (err) {
    console.error("Error in listLeads", err);
    next(err);
  }
}