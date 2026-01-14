import type { Request, Response, NextFunction } from "express";
import { fetchUnifiedInbox } from '../services/unifiedInboxService.js';

export async function getUnifiedInbox(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: true, message: "Authentication required" });
    }

    const payload = await fetchUnifiedInbox(req.user.id);
    res.json(payload);
  } catch (error) {
    next(error);
  }
}
