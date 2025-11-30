import { Router } from "express";
import { getPrioritisedInbox } from "../controllers/gmailInboxController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/gmail/inbox/prioritised", requireAuth, getPrioritisedInbox);

export default router;
