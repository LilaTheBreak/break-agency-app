import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as aiController from "../controllers/aiController.js";
import { inboxAiReply } from "../controllers/inboxAiReplyController.js";
import * as dealExtractorController from "../controllers/dealExtractorController.js";

const router = Router();

// POST /api/ai/:role - AI assistant chat for different user roles (handles auth in controller)
router.post("/:role", aiController.askAssistant);

// All other AI routes require authentication
router.use(requireAuth);

// POST /api/ai/reply - Generate email reply variations
router.post("/reply", inboxAiReply);

// POST /api/ai/summaries/business - Generate a high-level business summary
router.post("/summaries/business", aiController.generateBusinessSummary);

// POST /api/ai/deal/extract - Extract structured deal data from an email
router.post("/deal/extract", dealExtractorController.extractDealData);

// POST /api/ai/deal/negotiation - Generate a negotiation strategy for a deal
router.post("/deal/negotiation", aiController.generateNegotiationInsights);

// POST /api/ai/:role - AI assistant chat for different user roles
router.post("/:role", aiController.askAssistant);

// Placeholder for other AI routes
// router.post("/file/insights", aiController.generateFileInsights);
// router.post("/social/insights", aiController.generateSocialInsights);
// router.post("/summaries/inbox", aiController.generateInboxSummary);

export default router;
