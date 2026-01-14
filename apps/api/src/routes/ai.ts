import { Router, Request, Response } from "express";
import { requireAuth } from '../middleware/auth';
import { rateLimiters } from '../middleware/rateLimit';
import * as aiController from '../controllers/aiController';
import { inboxAiReply } from '../controllers/inboxAiReplyController';
import * as dealExtractorController from '../controllers/dealExtractorController';

const router = Router();

// Apply rate limiting to all AI endpoints
const aiRateLimiter = rateLimiters.aiRequests;

// GET /api/ai/health - Check if AI provider is configured and accessible
router.get("/health", async (req: Request, res: Response) => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return res.status(503).json({
      ok: false,
      status: "unconfigured",
      message: "OPENAI_API_KEY is not set in environment variables",
      error: "AI provider not configured"
    });
  }

  try {
    // Test API key validity with a simple request
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      }
    });

    if (!response.ok) {
      return res.status(503).json({
        ok: false,
        status: "invalid_key",
        message: "OpenAI API key is invalid or expired",
        error: `API returned ${response.status}`
      });
    }

    return res.json({
      ok: true,
      status: "healthy",
      message: "AI provider is configured and accessible"
    });
  } catch (error) {
    return res.status(503).json({
      ok: false,
      status: "connection_error",
      message: "Failed to connect to OpenAI API",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

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
