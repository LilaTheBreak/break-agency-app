import type { Request, Response, NextFunction } from "express";
import { getUserMessage } from "../integrations/gmail/googleClient.js";
import { parseEmailMetadata } from "../services/emailParser.js";
import { scoreEmail } from "../services/opportunityScoring.js";

export async function analyzeMessage(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: true, message: "Authentication required" });
    }
    const messageId = req.params.id;
    const message = await getUserMessage(req.user.id, messageId);
    const parsed = parseEmailMetadata({
      id: message.id,
      headers: message.headers,
      snippet: message.snippet,
      body: message.body
    });
    const scoring = scoreEmail(parsed);
    res.json({ parsed, scoring });
  } catch (error) {
    next(error);
  }
}
