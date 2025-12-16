import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { extractDealFromEmail } from "../services/ai/dealExtractor.js";

const ExtractDealSchema = z.object({
  emailId: z.string().cuid()
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
    const data = await extractDealFromEmail(email.body);
    const latency = Date.now() - startTime;

    return res.json({ ok: true, data, meta: { latency } });
  } catch (error) {
    return next(error);
  }
}

export async function extractDealFromMessage(req: Request, res: Response, next: NextFunction) {
  return extractDealData(req, res, next);
}
