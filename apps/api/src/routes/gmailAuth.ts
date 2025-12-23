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

router.get("/gmail/auth/url", requireAuth, (req, res) => {
  const url = getGmailAuthUrl(req.user!.id);
  res.json({ url });
});

router.get("/gmail/auth/callback", async (req, res) => {
  const code = typeof req.query.code === "string" ? req.query.code : null;
  const state = typeof req.query.state === "string" ? req.query.state : null;
  
  if (!code) {
    return res.status(400).json({ error: true, message: "Missing authorization code" });
  }
  
  // State contains the userId
  const userId = state || req.user?.id;
  if (!userId) {
    return res.status(400).json({ error: true, message: "Missing user ID" });
  }
  const tokens = await exchangeCodeForTokens(code);
  console.log("[GMAIL OAUTH CALLBACK] Tokens returned:", tokens);
  if (!tokens.refreshToken) {
    console.warn("WARNING: No refresh_token returned — Gmail connection will not work");
    return res.status(400).json({
      error: "missing_refresh_token",
      message: "Google did not return a refresh token. Ask the user to reconnect Gmail with forced consent.",
      requiresReauth: true
    });
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
    },
    create: {
      userId,
      accessToken: tokens.accessToken ?? "",
      refreshToken: tokens.refreshToken,
      expiryDate: tokens.expiresAt ?? null,
      scope: tokens.scope ?? null,
      tokenType: tokens.tokenType ?? null,
      idToken: tokens.idToken ?? null,
    }
  });
  
  console.log(`[GMAIL AUTH] Successfully connected Gmail for user ${userId}`);
  const redirectUrl = `${FRONTEND_ORIGIN.replace(/\/$/, "")}/admin/inbox?gmail_connected=1`;
  res.redirect(302, redirectUrl);
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

export default router;
