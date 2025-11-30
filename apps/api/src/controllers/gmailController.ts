import type { Request, Response, NextFunction } from "express";
import { buildAuthUrl, exchangeCodeForTokens, persistToken } from "../services/gmail/oauthService.js";
import { ingestGmailForUser } from "../services/gmail/gmailService.js";
import { sendSlackAlert } from "../integrations/slack/slackClient.js";

export async function getAuthUrl(_req: Request, res: Response, next: NextFunction) {
  try {
    const url = buildAuthUrl("");
    res.json({ url });
  } catch (error) {
    next(error);
  }
}

export async function handleCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const code = typeof req.query.code === "string" ? req.query.code : null;
    if (!code) {
      return res.status(400).json({ error: true, message: "Missing code" });
    }
    const tokens = await exchangeCodeForTokens(code);
    if (!req.user?.id) {
      return res.status(401).json({ error: true, message: "Authentication required" });
    }
    await persistToken(req.user.id, tokens);
    res.json({ success: true });
  } catch (error) {
    await sendSlackAlert("Gmail OAuth callback failed", { error: `${error}` });
    next(error);
  }
}

export async function ingest(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: true, message: "Authentication required" });
    }
    const result = await ingestGmailForUser(req.user.id);
    res.json({ processed: result.processed });
  } catch (error) {
    next(error);
  }
}
