import { Router } from "express";
import prisma from "../lib/prisma.js";
import { SocialPlatform } from "@prisma/client";
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
  await prisma.socialToken.upsert({
    where: { userId_platform: { userId: req.user.id, platform: SocialPlatform.GMAIL } },
    update: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt ?? null
    },
    create: {
      userId: req.user.id,
      platform: SocialPlatform.GMAIL,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt ?? null
    }
  });
  const redirectUrl = `${FRONTEND_ORIGIN.replace(/\/$/, "")}/inbox?gmail_connected=1`;
  res.redirect(302, redirectUrl);
});

export default router;
