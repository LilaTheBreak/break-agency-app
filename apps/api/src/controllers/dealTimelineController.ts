import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as dealTimelineService from "../services/dealTimelineService.js";

const AddEventSchema = z.object({
  type: z.string(),
  message: z.string(),
  metadata: z.unknown().optional(),
});

export async function createTimelineEvent(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { dealId } = req.params;
    const parsed = AddEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const event = await dealTimelineService.addEvent(dealId, {
      ...parsed.data,
      createdById: req.user!.id,
    });

    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
}

export async function getTimeline(req: Request, res: Response, next: NextFunction) {
  try {
    const { dealId } = req.params;
    const timeline = await dealTimelineService.getTimelineForDeal(dealId, req.user!.id);

    if (timeline === null) {
      return res.status(404).json({ error: "Deal not found or access denied." });
    }

    res.json(timeline);
  } catch (error) {
    next(error);
  }
}