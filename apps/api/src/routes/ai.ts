import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { rateLimiters } from "../middleware/rateLimit.js";
import * as aiController from "../controllers/aiController.js";
import { inboxAiReply } from "../controllers/inboxAiReplyController.js";
import * as dealExtractorController from "../controllers/dealExtractorController.js";

const router = Router();

// Apply rate limiting to all AI endpoints
const aiRateLimiter = rateLimiters.aiRequests;

// POST /api/ai/:role - AI assistant chat for different user roles (handles auth in controller)
router.post("/:role", aiController.askAssistant);

// All other AI routes require authentication
router.use(requireAuth);

// POST /api/ai/reply - Generate email reply variations
router.post("/reply", aiRateLimiter, inboxAiReply);

// POST /api/ai/summaries/business - Generate a high-level business summary
router.post("/summaries/business", aiRateLimiter, aiController.generateBusinessSummary);

// POST /api/ai/deal/extract - Extract structured deal data from an email
router.post("/deal/extract", aiRateLimiter, dealExtractorController.extractDealData);

// POST /api/ai/deal/negotiation - Generate a negotiation strategy for a deal
router.post("/deal/negotiation", aiRateLimiter, aiController.generateNegotiationInsights);

// POST /api/ai/:role - AI assistant chat for different user roles (rate limited in controller)
// Note: First route at top also handles this with rate limiting

// Placeholder for other AI routes
// router.post("/file/insights", aiController.generateFileInsights);
// router.post("/social/insights", aiController.generateSocialInsights);
// router.post("/summaries/inbox", aiController.generateInboxSummary);

export default router;
