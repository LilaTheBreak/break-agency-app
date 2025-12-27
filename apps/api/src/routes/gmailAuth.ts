import { Router } from "express";
import prisma from "../lib/prisma.js";
import { getGmailAuthUrl, exchangeCodeForTokens } from "../integrations/gmail/googleAuth.js";
import { google } from "googleapis";
import { googleConfig } from "../config/env.js";
import { refreshAccessToken } from "../integrations/gmail/googleAuth.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || process.env.WEB_APP_URL || "http://localhost:5173";

// GET /api/gmail/auth/status - Check if Gmail is connected
router.get("/status", requireAuth, async (req, res) => {
  try {
    const token = await prisma.gmailToken.findUnique({
      where: { userId: req.user!.id },
      select: { refreshToken: true, expiryDate: true }
    });
    
    res.json({
      connected: !!token?.refreshToken,
      expiresAt: token?.expiryDate || null
    });
  } catch (error) {
    console.error("[GMAIL AUTH STATUS]", error);
    res.json({ connected: false });
  }
});

router.get("/url", requireAuth, (req, res) => {
  const url = getGmailAuthUrl(req.user!.id);
  res.json({ url });
});

router.get("/callback", async (req, res) => {
  const code = typeof req.query.code === "string" ? req.query.code : null;
  const state = typeof req.query.state === "string" ? req.query.state : null;
  const userId = state || req.user?.id;
  
  console.log("[INTEGRATION] Gmail OAuth callback received", {
    hasCode: !!code,
    userId: userId || "unknown",
    timestamp: new Date().toISOString()
  });
  
  console.log("[GMAIL CALLBACK] Received callback request");
  console.log("[GMAIL CALLBACK] Query params:", req.query);
  console.log("[GMAIL CALLBACK] Headers:", req.headers);
  
  console.log("[GMAIL CALLBACK] Code:", code ? "present" : "missing");
  console.log("[GMAIL CALLBACK] State (userId):", state);
  
  if (!code) {
    console.error("[GMAIL CALLBACK] ERROR: Missing authorization code");
    console.error("[INTEGRATION] Gmail OAuth failed: Missing authorization code");
    return res.status(400).json({ error: true, message: "Missing authorization code" });
  }
  
  // State contains the userId
  console.log("[GMAIL CALLBACK] Resolved userId:", userId);
  
  if (!userId) {
    console.error("[GMAIL CALLBACK] ERROR: Missing user ID (no state and no req.user)");
    console.error("[INTEGRATION] Gmail OAuth failed: Missing user ID");
    return res.status(400).json({ error: true, message: "Missing user ID" });
  }
  
  try {
    console.log("[GMAIL CALLBACK] Exchanging code for tokens...");
    const tokens = await exchangeCodeForTokens(code);
    console.log("[GMAIL CALLBACK] Tokens received:", {
      hasAccessToken: !!tokens.accessToken,
      hasRefreshToken: !!tokens.refreshToken,
      expiresAt: tokens.expiresAt
    });
    
    if (!tokens.refreshToken) {
      console.error("[GMAIL CALLBACK] ERROR: No refresh_token returned");
      return res.status(400).json({
        error: "missing_refresh_token",
        message: "Google did not return a refresh token. Ask the user to reconnect Gmail with forced consent.",
        requiresReauth: true
      });
    }
    
    console.log("[GMAIL CALLBACK] Saving tokens to database for user:", userId);
    await prisma.gmailToken.upsert({
      where: { userId },
      update: {
        accessToken: tokens.accessToken ?? "",
        refreshToken: tokens.refreshToken,
        expiryDate: tokens.expiresAt ?? null,
        scope: tokens.scope ?? null,
        tokenType: tokens.tokenType ?? null,
        idToken: tokens.idToken ?? null,
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
    
    console.log(`[GMAIL CALLBACK] Successfully saved tokens for user ${userId}`);
    console.log("[INTEGRATION] Gmail OAuth successful", {
      userId,
      hasRefreshToken: !!tokens.refreshToken,
      timestamp: new Date().toISOString()
    });
    const redirectUrl = `${FRONTEND_ORIGIN.replace(/\/$/, "")}/admin/inbox?gmail_connected=1`;
    console.log(`[GMAIL CALLBACK] Redirecting to:`, redirectUrl);
    res.redirect(302, redirectUrl);
  } catch (error) {
    console.error("[GMAIL CALLBACK] ERROR during token exchange or save:", error);
    const errorRedirect = `${FRONTEND_ORIGIN.replace(/\/$/, "")}/admin/inbox?gmail_error=1`;
    console.log(`[GMAIL CALLBACK] Redirecting to error URL:`, errorRedirect);
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

    res.json({ 
      success: true, 
      draftId: draft.data.id,
      message: "Gmail draft created successfully"
    });
  } catch (error) {
    console.error("[DRAFT_QUEUE] Error:", error);
    res.status(500).json({ 
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
    res.json({ success: true, message: "Gmail disconnected successfully" });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      // Record not found
      return res.json({ success: true, message: "Gmail was not connected" });
    }
    console.error("[GMAIL AUTH DISCONNECT]", error);
    res.status(500).json({ error: "Failed to disconnect Gmail" });
  }
});

export default router;
