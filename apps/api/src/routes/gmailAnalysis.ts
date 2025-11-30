import { Router } from "express";
import { analyzeMessage } from "../controllers/gmailAnalysisController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/gmail/messages/:id/analyze", requireAuth, analyzeMessage);

export default router;
