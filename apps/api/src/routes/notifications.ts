import { Router, type Request, type Response } from "express";

const router = Router();

router.get("/api/notifications", (_req: Request, res: Response) => {
  res.json({ ok: true, notifications: [] });
});

export default router;
