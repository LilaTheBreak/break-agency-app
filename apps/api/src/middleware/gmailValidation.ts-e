/**
 * Gmail Validation Middleware
 * 
 * Enforces that Gmail OAuth credentials are valid and real.
 * Returns 503 Service Unavailable if:
 * - GOOGLE_CLIENT_ID is missing or is placeholder ("your-google-client-id", "test")
 * - GOOGLE_CLIENT_SECRET is missing or is placeholder
 * - GOOGLE_REDIRECT_URI is missing
 * 
 * This prevents partial OAuth flows and credential confusion.
 */

import { Request, Response, NextFunction } from "express";
import { googleConfig, validateProductionCredentials } from '../config/env';

interface GmailValidationStatus {
  enabled: boolean;
  reason?: string;
}

let gmailValidationStatus: GmailValidationStatus = { enabled: true };

/**
 * Check if Gmail credentials are valid
 * Called at server startup to set gmailValidationStatus
 */
export function validateGmailCredentials(): void {
  const validation = validateProductionCredentials();
  
  if (!validation.valid) {
    gmailValidationStatus = {
      enabled: false,
      reason: validation.errors.join("; ")
    };
    
    console.error("❌ [GMAIL VALIDATION] Gmail integration DISABLED at startup:");
    validation.errors.forEach((err) => {
      console.error(`   - ${err}`);
    });
  } else {
    gmailValidationStatus = { enabled: true };
    console.log("✅ [GMAIL VALIDATION] Gmail credentials validated successfully");
  }
}

/**
 * Middleware to check Gmail is enabled before allowing requests
 */
export function requireGmailEnabled(req: Request, res: Response, next: NextFunction) {
  if (!gmailValidationStatus.enabled) {
    return res.status(503).json({
      error: "gmail_disabled",
      message: "Gmail integration is currently disabled. Please contact support.",
      reason: gmailValidationStatus.reason,
      details: {
        missingCredentials: true,
        affectedEndpoints: [
          "/api/gmail/auth/url",
          "/api/gmail/auth/callback",
          "/api/gmail/auth/disconnect",
          "/api/gmail/auth/status",
          "/api/gmail/messages",
          "/api/gmail/analysis/*",
          "/api/gmail/inbox/*",
          "/api/gmail/webhook/*"
        ]
      }
    });
  }
  next();
}

/**
 * Get current Gmail validation status (for diagnostics)
 */
export function getGmailValidationStatus(): GmailValidationStatus {
  return gmailValidationStatus;
}

/**
 * Check if Gmail is enabled (useful for conditional UI/feature gates)
 */
export function isGmailEnabled(): boolean {
  return gmailValidationStatus.enabled;
}

export default requireGmailEnabled;
