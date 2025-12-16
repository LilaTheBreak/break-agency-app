import { Router } from "express";
import prisma from "../lib/prisma.js";
import { getGmailAuthUrl, exchangeCodeForTokens } from "../integrations/gmail/googleAuth.js";

const router = Router();
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || process.env.WEB_APP_URL || "http://localhost:5173";

router.get("/gmail/auth/url", (_req, res) => {
  const url = getGmailAuthUrl("");
  res.json({ url });
});

router.get("/gmail/auth/callback", async (req, res) => {
  const code = typeof req.query.code === "string" ? req.query.code : null;
  if (!code || !req.user?.id) {
    return res.status(400).json({ error: true, message: "Missing code or user" });
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
    where: { userId: req.user.id },
    update: {
      accessToken: tokens.accessToken ?? "",
      refreshToken: tokens.refreshToken,
      expiryDate: tokens.expiresAt ?? null,
      scope: tokens.scope ?? null,
      tokenType: tokens.tokenType ?? null,
      idToken: tokens.idToken ?? null,
    },
    create: {
      userId: req.user.id,
      accessToken: tokens.accessToken ?? "",
      refreshToken: tokens.refreshToken,
      expiryDate: tokens.expiresAt ?? null,
      scope: tokens.scope ?? null,
      tokenType: tokens.tokenType ?? null,
      idToken: tokens.idToken ?? null,
    }
  });
  const redirectUrl = `${FRONTEND_ORIGIN.replace(/\/$/, "")}/inbox?gmail_connected=1`;
  res.redirect(302, redirectUrl);
});

export default router;
