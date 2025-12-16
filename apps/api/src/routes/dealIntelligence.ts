import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const DISABLED_RESPONSE = {
  success: false,
  error: "Deal intelligence features temporarily disabled — dependent models removed from schema."
};

router.use("/api/deals/intelligence", requireAuth);

router.post("/api/deals/intelligence/run/:dealId", (_req: Request, res: Response) => {
  res.status(501).json(DISABLED_RESPONSE);
});

router.get("/api/deals/intelligence/:dealId", (_req: Request, res: Response) => {
  res.status(501).json(DISABLED_RESPONSE);
});

router.post("/api/deals/:dealId/draft-email", (_req: Request, res: Response) => {
  res.status(501).json(DISABLED_RESPONSE);
});

export default router;
