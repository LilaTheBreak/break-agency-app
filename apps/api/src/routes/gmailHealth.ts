/**
 * Gmail Health Check Endpoint
 * Used for diagnostics and monitoring
 * 
 * GET /api/gmail/health
 * Returns current Gmail integration status
 */

import { Router } from "express";
import { getGmailValidationStatus, isGmailEnabled } from '../middleware/gmailValidation';
import { googleConfig } from '../config/env';

const router = Router();

router.get("/health", async (req, res) => {
  const status = getGmailValidationStatus();
  const enabled = isGmailEnabled();
  
  const response = {
    gmail_enabled: enabled,
    status: status.enabled ? "operational" : "disabled",
    reason: status.reason || "All systems operational",
    config: {
      clientIdConfigured: !!googleConfig.clientId && googleConfig.clientId !== "test" && googleConfig.clientId !== "your-google-client-id",
      clientSecretConfigured: !!googleConfig.clientSecret && googleConfig.clientSecret !== "test" && googleConfig.clientSecret !== "your-google-client-secret",
      redirectUriConfigured: !!googleConfig.redirectUri && !googleConfig.redirectUri.includes("undefined"),
      redirectUri: googleConfig.redirectUri || "not configured"
    },
    affected_endpoints: enabled ? [] : [
      "GET /api/gmail/auth/url",
      "GET /api/gmail/auth/callback",
      "POST /api/gmail/auth/disconnect",
      "GET /api/gmail/auth/status",
      "GET /api/gmail/messages",
      "GET /api/gmail/messages/:id",
      "GET /api/gmail/threads/:id",
      "POST /api/gmail/sync",
      "GET /api/gmail/inbox",
      "GET /api/gmail/inbox/unread",
      "GET /api/gmail/inbox/search",
      "GET /api/gmail/inbox/thread/:threadId",
      "POST /api/gmail/inbox/sync",
      "POST /api/gmail/webhook/*"
    ],
    timestamp: new Date().toISOString()
  };

  // Return 503 if Gmail is disabled
  if (!enabled) {
    return res.status(503).json(response);
  }

  return res.json(response);
});

export default router;
