import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as insightLLM from '../services/ai/insightLLM';
import * as dealExtractor from '../services/ai/dealExtractor';
import { getAssistantResponse } from '../services/ai/aiAssistant';
import prisma from '../lib/prisma';
import { logAIInteraction } from '../lib/aiHistoryLogger';

export async function generateBusinessSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id;
    // In a real app, you'd aggregate real data here.
    const mockInsightsData = { totalRevenue: 100000, newDeals: 25, inboxVolume: 500 };
    const startTime = Date.now();
    const data = await insightLLM.generateBusinessSummary(mockInsightsData);
    const latency = Date.now() - startTime;

    // Log AI history
    if (userId) {
      await logAIInteraction(
        userId,
        "Generate business summary",
        JSON.stringify(data),
        "business_summary",
        { latency, mockData: true }
      ).catch(err => console.error("[AI History] Failed to log business summary:", err));
    }

    return res.json({ ok: true, data, meta: { latency } });
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

    return res.json({ ok: true, data, meta: { latency } });
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

    // Feature disabled - return 503
    return res.status(503).json({ 
      ok: false, 
      error: "Feature temporarily disabled",
      message: "Negotiation insights feature is coming soon. This feature is temporarily disabled.",
      code: "FEATURE_DISABLED"
    });
  } catch (error) {
    next(error);
  }
}

const AssistantSchema = z.object({
  userInput: z.string().min(1),
  contextId: z.string().optional(),
  userId: z.string().optional(),
});

export async function askAssistant(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = req.params;
    const parsed = AssistantSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid payload", details: parsed.error });
    }

    // Try to get userId from auth middleware first, fallback to request body
    const userId = (req as any).user?.id || parsed.data.userId;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "User not authenticated" });
    }

    const startTime = Date.now();
    const result = await getAssistantResponse({
      role: role || "admin",
      userId,
      contextId: parsed.data.contextId,
      userInput: parsed.data.userInput,
    });
    const latency = Date.now() - startTime;

    // Log AI history
    await logAIInteraction(
      userId,
      parsed.data.userInput,
      result.text,
      `assistant_${role || "admin"}`,
      { latency, role: role || "admin", contextId: parsed.data.contextId }
    ).catch(err => console.error("[AI History] Failed to log assistant interaction:", err));

    return res.json({ ok: true, suggestions: result.text, meta: { latency } });
  } catch (error) {
    console.error("[AI Assistant Error]", error);
    next(error);
  }
}

// Other AI controller functions (file insights, social insights) would follow this pattern.