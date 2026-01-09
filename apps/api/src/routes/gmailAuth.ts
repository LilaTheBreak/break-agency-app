import { Router } from "express";
import prisma from "../lib/prisma.js";
import { getGmailAuthUrl, exchangeCodeForTokens } from "../integrations/gmail/googleAuth.js";
import { google } from "googleapis";
import { googleConfig } from "../config/env.js";
import { refreshAccessToken } from "../integrations/gmail/googleAuth.js";
import { requireAuth } from "../middleware/auth.js";
import { oauthCallbackLimiter } from "../middleware/rateLimiter.js";
import { getFrontendUrl } from "../config/frontendUrl.js";

const router = Router();

// GET /api/gmail/auth/status - Check if Gmail is connected
router.get("/status", requireAuth, async (req, res) => {
  try {
    const token = await prisma.gmailToken.findUnique({
      where: { userId: req.user!.id },
      select: { 
        refreshToken: true, 
        expiryDate: true, 
        lastSyncedAt: true,
        lastError: true,
        lastErrorAt: true,
      }
    });
    
    if (!token || !token.refreshToken) {
      return res.json({
        connected: false,
        status: "disconnected",
        message: "Gmail account not connected. Please authenticate to continue."
      });
    }
    
    // Determine connection status
    let status = "connected";
    let message = "Gmail connected successfully";
    
    if (token.lastError) {
      status = "error";
      message = token.lastError;
    }
    
    // Get sync stats
    const emailCount = await prisma.inboundEmail.count({
      where: { userId: req.user!.id }
    });

    // Get CRM creation stats from metadata
    const emailsWithCrmLinks = await prisma.inboundEmail.count({
      where: {
        userId: req.user!.id,
        metadata: {
          path: ["crmContactId"],
          not: null
        }
      }
    });

    // Get unique contacts created from Gmail
    const contactsFromGmail = await prisma.crmBrandContact.count({
      where: {
        notes: {
          contains: "Auto-created from Gmail"
        }
      }
    });

    // Get unique brands created from Gmail
    const brandsFromGmail = await prisma.crmBrand.count({
      where: {
        internalNotes: {
          contains: "Auto-created from Gmail"
        }
      }
    });

    // Get error count from audit logs (GMAIL_SYNC_FAILED actions)
    const errorCount = await prisma.auditLog.count({
      where: {
        userId: req.user!.id,
        action: "GMAIL_SYNC_FAILED"
      }
    });
    
    return res.json({
      connected: true,
      status,
      message,
      expiresAt: token?.expiryDate || null,
      lastSyncedAt: token?.lastSyncedAt || null,
      lastError: token?.lastError || null,
      lastErrorAt: token?.lastErrorAt || null,
      stats: {
        emailsIngested: emailCount,
        emailsLinked: emailsWithCrmLinks,
        contactsCreated: contactsFromGmail,
        brandsCreated: brandsFromGmail,
        errors: errorCount,
      }
    });
  } catch (error) {
    console.error("[GMAIL AUTH STATUS]", error);
    return res.status(500).json({ 
      connected: false,
      status: "error",
      message: error instanceof Error ? error.message : "Failed to check Gmail status"
    });
  }
});

router.get("/url", requireAuth, (req, res) => {
  const url = getGmailAuthUrl(req.user!.id);
  return res.json({ url });
});

/**
 * GET /api/gmail/auth/callback
 * Handle Gmail OAuth callback
 */
router.get("/callback", oauthCallbackLimiter, async (req, res) => {
  const code = typeof req.query.code === "string" ? req.query.code : null;
  const state = typeof req.query.state === "string" ? req.query.state : null;
  const userId = state || req.user?.id;
  
  console.log("[INTEGRATION] Gmail OAuth callback received", {
    hasCode: !!code,
    userId: userId || "unknown",
    timestamp: new Date().toISOString()
  });
  
  if (!code) {
    console.error("[INTEGRATION] Gmail OAuth failed: Missing authorization code");
    return res.status(400).json({ error: true, message: "Missing authorization code" });
  }
  
  if (!userId) {
    console.error("[INTEGRATION] Gmail OAuth failed: Missing user ID");
    return res.status(400).json({ error: true, message: "Missing user ID" });
  }
  
  try {
    const tokens = await exchangeCodeForTokens(code);
    
    if (!tokens.refreshToken) {
      const errorRedirect = `${getFrontendUrl().replace(/\/$/, "")}/admin/inbox?gmail_error=missing_refresh_token`;
      return res.redirect(302, errorRedirect);
    }
    
    await prisma.gmailToken.upsert({
      where: { userId },
      update: {
        accessToken: tokens.accessToken ?? "",
        refreshToken: tokens.refreshToken,
        expiryDate: tokens.expiresAt ?? null,
        scope: tokens.scope ?? null,
        tokenType: tokens.tokenType ?? null,
        idToken: tokens.idToken ?? null,
        lastError: null,
        lastErrorAt: null,
      },
      create: {
        updatedAt: new Date(),
        userId,
        accessToken: tokens.accessToken ?? "",
        refreshToken: tokens.refreshToken,
        expiryDate: tokens.expiresAt ?? null,
        scope: tokens.scope ?? null,
        tokenType: tokens.tokenType ?? null,
        idToken: tokens.idToken ?? null,
      }
    });
    
    // WORKFLOW ASSERTION: OAuth connect → Sync attempt must be made
    const { syncInboxForUser } = await import("../services/gmail/syncInbox.js");
    syncInboxForUser(userId)
      .then((stats) => {
        console.log(`[GMAIL CALLBACK] ✅ Initial sync completed for user ${userId}:`, stats);
        // Assertion: Verify sync actually ran
        if (stats.imported === 0 && stats.updated === 0 && stats.skipped === 0) {
          console.warn(`[GMAIL CALLBACK] ⚠️  Sync completed but no messages processed - may indicate empty inbox or sync issue`);
        }
      })
      .catch((syncError) => {
        const errorMessage = syncError instanceof Error ? syncError.message : String(syncError);
        console.error(`[GMAIL CALLBACK] ❌ CRITICAL: Initial sync failed for user ${userId}:`, errorMessage);
        // Log critical error but don't block OAuth completion
        // This allows user to manually sync later
      });
    
    const redirectUrl = `${getFrontendUrl().replace(/\/$/, "")}/admin/inbox?gmail_connected=1`;
    res.redirect(302, redirectUrl);
  } catch (error) {
    console.error("[GMAIL CALLBACK] ERROR:", error);
    let errorMessage = "unknown_error";
    if (error instanceof Error) {
      if (error.message.includes("redirect_uri_mismatch")) {
        errorMessage = "redirect_uri_mismatch";
      } else if (error.message.includes("invalid_grant") || error.message.includes("Code was already redeemed")) {
        errorMessage = "code_expired";
      } else if (error.message.includes("invalid_client")) {
        errorMessage = "invalid_credentials";
      }
    }
    const errorRedirect = `${getFrontendUrl().replace(/\/$/, "")}/admin/inbox?gmail_error=${errorMessage}`;
    res.redirect(302, errorRedirect);
  }
});

// POST /api/gmail/auth/draft-queue - Create Gmail draft with queue items as to-do list
router.post("/draft-queue", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { queueItems, subject, recipient } = req.body;
    
    if (!queueItems || !Array.isArray(queueItems)) {
      return res.status(400).json({ error: "Queue items required" });
    }

    // Get user's Gmail token
    const gmailToken = await prisma.gmailToken.findUnique({
      where: { userId }
    });

    if (!gmailToken) {
      return res.status(400).json({ 
        error: "Gmail not connected",
        message: "Please connect your Gmail account first"
      });
    }

    // Check if token needs refresh
    let accessToken = gmailToken.accessToken;
    if (gmailToken.expiryDate && new Date(gmailToken.expiryDate) < new Date()) {
      const refreshed = await refreshAccessToken(gmailToken.refreshToken);
      accessToken = refreshed.accessToken;
      
      await prisma.gmailToken.update({
        where: { userId },
        data: {
          accessToken: refreshed.accessToken,
          expiryDate: refreshed.expiresAt || null
        }
      });
    }

    // Create OAuth2 client with tokens
    const oauth2Client = new google.auth.OAuth2(
      googleConfig.clientId,
      googleConfig.clientSecret,
      googleConfig.redirectUri
    );
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: gmailToken.refreshToken
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Build to-do list content
    let todoList = "Hello,\n\nHere's the current queue requiring attention:\n\n";
    queueItems.forEach((item: any, index: number) => {
      todoList += `${index + 1}. ${item.title}\n`;
      if (item.owner) todoList += `   Owner: ${item.owner}\n`;
      if (item.status) todoList += `   Status: ${item.status}\n`;
      if (item.meta) todoList += `   ${item.meta}\n`;
      todoList += "\n";
    });
    todoList += "\nPlease review and take appropriate action.\n\nBest regards";

    // Create email in RFC 2822 format
    const emailLines = [
      recipient ? `To: ${recipient}` : "",
      `Subject: ${subject || "Queue Update - Items Requiring Attention"}`
    ].filter(Boolean);
    
    emailLines.push("");
    emailLines.push(todoList);
    
    const email = emailLines.join("\r\n");
    const encodedEmail = Buffer.from(email)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Create draft
    const draft = await gmail.users.drafts.create({
      userId: "me",
      requestBody: {
        message: {
          raw: encodedEmail
        }
      }
    });

    return res.json({ 
      success: true, 
      draftId: draft.data.id,
      message: "Gmail draft created successfully"
    });
  } catch (error) {
    console.error("[DRAFT_QUEUE] Error:", error);
    return res.status(500).json({ 
      error: "Failed to create Gmail draft",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/gmail/auth/disconnect - Disconnect Gmail integration
router.post("/disconnect", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    await prisma.gmailToken.delete({
      where: { userId }
    });
    
    console.log(`[GMAIL AUTH] Successfully disconnected Gmail for user ${userId}`);
    return res.json({ success: true, message: "Gmail disconnected successfully" });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      // Record not found
      return res.json({ success: true, message: "Gmail was not connected" });
    }
    console.error("[GMAIL AUTH DISCONNECT]", error);
    return res.status(500).json({ error: "Failed to disconnect Gmail" });
  }
});

export default router;
