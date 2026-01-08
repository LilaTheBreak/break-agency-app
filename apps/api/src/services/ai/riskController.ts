import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as riskService from "../riskService.js";

const AnalyzeTextSchema = z.object({
  text: z.string().min(10),
});

/**
 * Analyzes a block of text for potential risks.
 */
export async function analyzeForRisks(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = AnalyzeTextSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid payload", details: parsed.error.flatten() });
    }

    console.log("analyzeForRisks called");
    const riskResult = riskService.detectRisks(parsed.data.text);

    return res.json({ ok: true, data: riskResult });
  } catch (err) {
    console.error("Error in analyzeForRisks", err);
    next(err);
  }
}