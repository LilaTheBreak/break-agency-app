import { Router, type Request, type Response } from "express";
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get("/inbox/analytics", requireAuth, (_req: Request, res: Response) => {
  res.json({ ok: true, stats: [], message: "Inbox analytics placeholder" });
});

export default router;
