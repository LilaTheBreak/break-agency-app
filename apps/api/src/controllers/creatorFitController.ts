import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as creatorFitEngine from "../services/ai/creatorFitEngine.js";
import prisma from "../lib/prisma.js";

const CalculateFitSchema = z.object({
  talentId: z.string().cuid(),
  brandId: z.string().cuid(),
  campaignId: z.string().cuid().optional(),
});

export async function calculateCreatorFit(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = CalculateFitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }
    const { talentId, brandId, campaignId } = parsed.data;
    const fitScore = await creatorFitEngine.computeCreatorFit(talentId, brandId, campaignId);
    res.json(fitScore);
  } catch (error) {
    next(error);
  }
}

export async function calculateBatchFit(req: Request, res: Response, next: NextFunction) {
  // Placeholder for batch processing logic
  res.status(501).json({ error: "Batch processing not implemented yet." });
}

export async function fetchTalentFit(req: Request, res: Response, next: NextFunction) {
  try {
    const { talentId } = req.params;
    const scores = await prisma.creatorFitScore.findMany({
      where: { talentId },
      include: { brand: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ ok: true, scores });
  } catch (error) {
    next(error);
  }
}

export async function fetchBrandFit(req: Request, res: Response, next: NextFunction) {
  try {
    const { brandId } = req.params;
    const scores = await prisma.creatorFitScore.findMany({
      where: { brandId },
      include: { talent: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ ok: true, scores });
  } catch (error) {
    next(error);
  }
}