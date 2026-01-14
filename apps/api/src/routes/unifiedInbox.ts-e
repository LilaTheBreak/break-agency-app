import { Router } from "express";
import { requireAuth } from '../middleware/auth';
import { getUnifiedInbox } from '../controllers/unifiedInboxController';

const router = Router();

router.get("/inbox/unified", requireAuth, getUnifiedInbox);

export default router;
