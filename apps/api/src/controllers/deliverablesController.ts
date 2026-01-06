import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as deliverablesService from "../services/deliverablesService.js";

const DeliverableCreateSchema = z.object({
  dealId: z.string().cuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  deliverableType: z.string().optional(),
  usageRights: z.string().optional(),
  frequency: z.string().optional(),
  dueAt: z.string().datetime().optional()
});

const DeliverableUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  deliverableType: z.string().optional(),
  usageRights: z.string().optional(),
  frequency: z.string().optional(),
  dueAt: z.string().datetime().optional()
});

const DeliverableActionSchema = z.object({
  reason: z.string().optional(),
  reviewerUserId: z.string().optional()
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
    
    const data = {
      ...parsed.data,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined
    };
    
    const deliverable = await deliverablesService.create(data);
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
    
    const data = {
      ...parsed.data,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined
    };
    
    const deliverable = await deliverablesService.update(id, data);
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
    // Always return 200 with JSON - never 204 No Content
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function uploadProof(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { fileUrl, fileName } = req.body;

    if (!fileUrl || !fileName) {
      res.status(400).json({ 
        error: "fileUrl and fileName are required" 
      });
      return;
    }

    const item = await deliverablesService.uploadProof(id, fileUrl, fileName);
    res.json(item);
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
    const parsed = DeliverableActionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      return;
    }
    
    const userId = req.user?.id;
    await deliverablesService.requestRevision(id, parsed.data.reason, userId);
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
    const userId = req.user?.id;
    await deliverablesService.approve(id, userId);
    res.json({ message: "Deliverable approved" });
  } catch (error) {
    next(error);
  }
}

export async function rejectDeliverable(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const parsed = DeliverableActionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      return;
    }
    
    const userId = req.user?.id;
    await deliverablesService.reject(id, parsed.data.reason, userId);
    res.json({ message: "Deliverable rejected" });
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

export async function getDeliverableItems(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const items = await deliverablesService.getItemsForDeliverable(id);
    res.json(items);
  } catch (error) {
    next(error);
  }
}
