import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/api/dashboard/aggregate", requireAuth, (_req: Request, res: Response) => {
  // REMOVED: Dashboard aggregator not implemented
  res.status(410).json({
    success: false,
    error: "Dashboard aggregation temporarily disabled — dealThread models removed from schema."
  });
});

export default router;
