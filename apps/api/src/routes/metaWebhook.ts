import type { Request, Response } from "express";

/**
 * Meta (Instagram Graph API) Webhook Verification Handler
 * 
 * This endpoint handles Meta's webhook verification challenge during app setup.
 * Meta requires a GET endpoint that responds to verification requests with the challenge string.
 * 
 * This is a minimal stub implementation for Meta UI compliance only.
 * We do NOT enable webhook subscriptions or process POST events.
 * 
 * @route GET /api/webhooks/meta
 * @public - No authentication required (Meta needs to verify)
 */
export function metaWebhookVerificationHandler(req: Request, res: Response): Response | void {
  console.log("[META_WEBHOOK] Verification request received");
  console.log("[META_WEBHOOK] Query params:", req.query);
  
  const mode = req.query["hub.mode"] as string | undefined;
  const verifyToken = req.query["hub.verify_token"] as string | undefined;
  const challenge = req.query["hub.challenge"] as string | undefined;
  
  console.log("[META_WEBHOOK] Mode:", mode);
  console.log("[META_WEBHOOK] Verify token received:", verifyToken ? `${verifyToken.slice(0, 4)}****` : "(missing)");
  console.log("[META_WEBHOOK] Challenge:", challenge);
  
  // Check if WEBHOOK_VERIFY_TOKEN is configured
  const expectedToken = process.env.WEBHOOK_VERIFY_TOKEN;
  if (!expectedToken) {
    console.error("[META_WEBHOOK] ERROR: WEBHOOK_VERIFY_TOKEN environment variable is not set");
    console.error("[META_WEBHOOK] Please set WEBHOOK_VERIFY_TOKEN in your environment variables");
    return res.status(503).json({ 
      error: "Webhook verification not configured",
      message: "WEBHOOK_VERIFY_TOKEN environment variable is missing"
    });
  }
  
  // Meta requires hub.mode=subscribe for verification
  if (mode !== "subscribe") {
    console.warn("[META_WEBHOOK] Invalid mode:", mode);
    console.warn("[META_WEBHOOK] Expected 'subscribe', got:", mode);
    return res.status(400).json({ 
      error: "Invalid verification request",
      message: "hub.mode must be 'subscribe'"
    });
  }
  
  // Verify token must match
  if (!verifyToken || verifyToken !== expectedToken) {
    console.warn("[META_WEBHOOK] Token mismatch");
    console.warn("[META_WEBHOOK] Expected:", expectedToken ? `${expectedToken.slice(0, 4)}****` : "(not set)");
    console.warn("[META_WEBHOOK] Received:", verifyToken ? `${verifyToken.slice(0, 4)}****` : "(missing)");
    return res.status(403).json({ 
      error: "Invalid verify token"
    });
  }
  
  // Challenge is required
  if (!challenge) {
    console.warn("[META_WEBHOOK] Missing challenge parameter");
    return res.status(400).json({ 
      error: "Missing challenge",
      message: "hub.challenge parameter is required"
    });
  }
  
  // Verification successful - return challenge string as plain text
  console.log("[META_WEBHOOK] ✅ Verification successful");
  console.log("[META_WEBHOOK] Returning challenge:", challenge);
  
  // Meta expects the challenge string as the response body (plain text, not JSON)
  return res.status(200).send(challenge);
}

