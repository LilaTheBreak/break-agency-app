import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const DISABLED_RESPONSE = {
  success: false,
  error: "Deal intelligence features temporarily disabled — dependent models removed from schema."
};

router.use("/api/deals/intelligence", requireAuth);

router.post("/api/deals/intelligence/run/:dealId", (_req: Request, res: Response) => {
  // REMOVED: Deal intelligence feature not implemented - dependent models removed
  res.status(410).json({ 
    error: "Deal intelligence feature removed",
    message: "This feature is not yet implemented. Dependent models were removed from schema."
  });
});

router.get("/api/deals/intelligence/:dealId", (_req: Request, res: Response) => {
  // REMOVED: Deal intelligence feature not implemented - dependent models removed
  res.status(410).json({ 
    error: "Deal intelligence feature removed",
    message: "This feature is not yet implemented. Dependent models were removed from schema."
  });
});

router.post("/api/deals/:dealId/draft-email", (_req: Request, res: Response) => {
  // REMOVED: Deal intelligence feature not implemented - dependent models removed
  res.status(410).json({ 
    error: "Deal intelligence feature removed",
    message: "This feature is not yet implemented. Dependent models were removed from schema."
  });
});

export default router;
