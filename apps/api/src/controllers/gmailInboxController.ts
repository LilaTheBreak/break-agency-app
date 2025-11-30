import type { Request, Response, NextFunction } from "express";
import { getUserMessages } from "../integrations/gmail/googleClient.js";
import { parseEmailMetadata } from "../services/emailParser.js";
import { prioritiseMessages } from "../services/inboxPrioritiser.js";

export async function getPrioritisedInbox(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: true, message: "Authentication required" });
    }
    const msgs = await getUserMessages(req.user.id);
    const parsed = msgs.map((msg) =>
      parseEmailMetadata({
        id: msg.id,
        headers: msg.headers || {},
        snippet: msg.snippet || "",
        body: msg.body || ""
      })
    );
    const inbox = prioritiseMessages(parsed);
    const totals = {
      high: inbox.filter((i) => i.priority === "high").length,
      medium: inbox.filter((i) => i.priority === "medium").length,
      low: inbox.filter((i) => i.priority === "low").length
    };
    res.json({ inbox, totals });
  } catch (error) {
    next(error);
  }
}
