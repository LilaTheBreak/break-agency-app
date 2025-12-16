import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as insightLLM from "../services/ai/insightLLM";
import * as dealExtractor from "../services/ai/dealExtractor";
import * as negotiationLLM from "../services/ai/negotiationLLM";
import prisma from "../lib/prisma";

export async function generateBusinessSummary(req: Request, res: Response, next: NextFunction) {
  try {
    // In a real app, you'd aggregate real data here.
    const mockInsightsData = { totalRevenue: 100000, newDeals: 25, inboxVolume: 500 };
    const startTime = Date.now();
    const data = await insightLLM.generateBusinessSummary(mockInsightsData);
    const latency = Date.now() - startTime;

    res.json({ ok: true, data, meta: { latency } });
  } catch (error) {
    next(error);
  }
}

const ExtractDealSchema = z.object({
  emailId: z.string().cuid(),
});

export async function extractDealData(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = ExtractDealSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid payload" });
    }

    const email = await prisma.inboundEmail.findUnique({ where: { id: parsed.data.emailId } });
    if (!email || !email.body) {
      return res.status(404).json({ ok: false, error: "Email not found or has no content" });
    }

    const startTime = Date.now();
    const data = await dealExtractor.extractDealFromEmail(email.body);
    const latency = Date.now() - startTime;

    res.json({ ok: true, data, meta: { latency } });
  } catch (error) {
    next(error);
  }
}

const NegotiationSchema = z.object({
  dealId: z.string().cuid(),
});

export async function generateNegotiationInsights(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = NegotiationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid payload" });
    }

    const startTime = Date.now();
    // This service needs to be refactored to use the `Deal` model.
    // For now, we call a placeholder.
    const data = await negotiationLLM.generateNegotiationStrategy(parsed.data.dealId);
    const latency = Date.now() - startTime;

    res.json({ ok: true, data, meta: { latency } });
  } catch (error) {
    next(error);
  }
}

// Other AI controller functions (file insights, social insights) would follow this pattern.