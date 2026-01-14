import type { Request, Response, NextFunction } from "express";
import * as analysisService from '../services/gmail/gmailAnalysisService.js';
import prisma from '../lib/prisma.js';

export async function analyzeSingleEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { emailId } = req.params;
    const analysisResult = await analysisService.analyzeEmailById(
      emailId,
      req.user!.id
    );
    if (!analysisResult) {
      res.status(404).json({ error: "Email not found or does not belong to user." });
      return;
    }
    res.json(analysisResult);
  } catch (error) {
    next(error);
  }
}

export async function getAnalysisForEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { emailId } = req.params;
    const email = await prisma.inboundEmail.findFirst({
      where: { id: emailId, userId: req.user!.id },
      select: {
        aiCategory: true,
        aiUrgency: true,
        aiSummary: true,
        aiRecommendedAction: true,
        aiConfidence: true,
        aiJson: true
      }
    });

    if (!email) {
      res.status(404).json({ error: "Email not found or does not belong to user." });
      return;
    }
    res.json(email);
  } catch (error) {
    next(error);
  }
}

export async function analyzeEmailThread(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { threadId } = req.params;
    const result = await analysisService.analyzeThreadById(threadId, req.user!.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function analyzeBulkEmails(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await analysisService.analyzeBulkForUser(req.user!.id);
    res.json({ message: "Bulk analysis initiated.", ...stats });
  } catch (error) {
    next(error);
  }
}
