import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/stats", requireAuth, (_req: Request, res: Response) => {
  res.status(501).json({
    ok: false,
    error: "Dashboard stats temporarily disabled — dealThread models removed from schema."
  });
});

export default router;
