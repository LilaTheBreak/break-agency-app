import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as deliverablesService from "../services/deliverablesService.js";

const DeliverableCreateSchema = z.object({
  dealId: z.string().cuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional()
});

const DeliverableUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional()
});

export async function createDeliverable(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = DeliverableCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      return;
    }
    const deliverable = await deliverablesService.create(parsed.data);
    res.status(201).json(deliverable);
  } catch (error) {
    next(error);
  }
}

export async function getDeliverable(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const deliverable = await deliverablesService.get(id);
    if (!deliverable) {
      res.status(404).json({ error: "Deliverable not found" });
      return;
    }
    res.json(deliverable);
  } catch (error) {
    next(error);
  }
}

export async function updateDeliverable(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const parsed = DeliverableUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      return;
    }
    const deliverable = await deliverablesService.update(id, parsed.data);
    if (!deliverable) {
      res.status(404).json({ error: "Deliverable not found" });
      return;
    }
    res.json(deliverable);
  } catch (error) {
    next(error);
  }
}

export async function deleteDeliverable(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    await deliverablesService.remove(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function submitDeliverable(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    await deliverablesService.submit(id);
    res.json({ message: "Deliverable submitted" });
  } catch (error) {
    next(error);
  }
}

export async function requestRevision(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    await deliverablesService.requestRevision(id);
    res.json({ message: "Revision requested" });
  } catch (error) {
    next(error);
  }
}

export async function approveDeliverable(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    await deliverablesService.approve(id);
    res.json({ message: "Deliverable approved" });
  } catch (error) {
    next(error);
  }
}

export async function listDeliverablesForDeal(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { dealId } = req.params;
    const deliverables = await deliverablesService.getByDeal(dealId);
    res.json(deliverables);
  } catch (error) {
    next(error);
  }
}