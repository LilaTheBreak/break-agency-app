import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getUnifiedInbox } from "../controllers/unifiedInboxController.js";

const router = Router();

router.get("/inbox/unified", requireAuth, getUnifiedInbox);

export default router;
