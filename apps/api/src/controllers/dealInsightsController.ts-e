import type { Request, Response, NextFunction } from "express";
import * as dealInsightsService from '../services/dealInsightsService';

export async function getDealSummary(req: Request, res: Response, next: NextFunction) {
  try {
    // Placeholder for a summary endpoint
    return res.json({ ok: true, data: { message: "Deal summary endpoint" } });
  } catch (error) {
    next(error);
  }
}

export async function getDealWinRate(req: Request, res: Response, next: NextFunction) {
  try {
    const winRate = await dealInsightsService.getWinRate(req.user!.id);
    return res.json({ ok: true, data: { winRate } });
  } catch (error) {
    next(error);
  }
}

export async function getDealPace(req: Request, res: Response, next: NextFunction) {
  try {
    const pace = await dealInsightsService.getDealPace(req.user!.id);
    return res.json({ ok: true, data: { averageDaysToClose: pace } });
  } catch (error) {
    next(error);
  }
}

export async function getDealValueDistribution(req: Request, res: Response, next: NextFunction) {
  try {
    const distribution = await dealInsightsService.getValueDistribution(req.user!.id);
    return res.json({ ok: true, data: distribution });
  } catch (error) {
    next(error);
  }
}

export async function getDeliverablePerformance(req: Request, res: Response, next: NextFunction) {
  try {
    const performance = await dealInsightsService.getDeliverablePerformance(req.user!.id);
    return res.json({ ok: true, data: performance });
  } catch (error) {
    next(error);
  }
}