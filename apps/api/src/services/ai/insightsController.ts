import type { Request, Response, NextFunction } from "express";
import * as insightService from '../insightService';

/**
 * Generates and retrieves creator performance insights.
 */
export async function getCreatorInsights(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    console.log("getCreatorInsights called for user:", userId);

    // In a real implementation, you might check if recent insights exist
    // before generating new ones to save on costs.
    const insights = await insightService.generateCreatorInsights(userId);

    return res.json({ ok: true, data: insights });
  } catch (err) {
    console.error("Error in getCreatorInsights", err);
    // Pass error to the error handling middleware
    next(err);
  }
}