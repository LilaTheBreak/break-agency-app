import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as analysisController from "../controllers/gmailAnalysisController.js";

const router = Router();

// POST /api/gmail/analysis/email/:emailId - Trigger analysis for a single email
router.post(
  "/analysis/email/:emailId",
  requireAuth,
  analysisController.analyzeSingleEmail
);

// POST /api/gmail/analysis/reanalyse/:emailId - Force re-analysis of a single email
router.post(
  "/analysis/reanalyse/:emailId",
  requireAuth,
  analysisController.analyzeSingleEmail
);

// GET /api/gmail/analysis/email/:emailId - Retrieve stored analysis for an email
router.get(
  "/analysis/email/:emailId",
  requireAuth,
  analysisController.getAnalysisForEmail
);

// POST /api/gmail/analysis/thread/:threadId - Trigger analysis for an entire thread
router.post(
  "/analysis/thread/:threadId",
  requireAuth,
  analysisController.analyzeEmailThread
);

// POST /api/gmail/analysis/bulk - Trigger a bulk analysis for the user's latest emails
router.post("/analysis/bulk", requireAuth, analysisController.analyzeBulkEmails);

export default router;