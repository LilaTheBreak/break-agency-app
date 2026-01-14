import { Router, type Request, type Response } from "express";
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import OpenAI from "openai";
import { logAIInteraction } from '../lib/aiHistoryLogger';

const router = Router();
const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

/**
 * GET /api/inbox/ai-suggestions/:emailId
 * Generates AI-powered reply suggestions for a given email.
 */
router.get("/api/inbox/ai-suggestions/:emailId", requireAuth, async (req: Request, res: Response) => {
  const { emailId } = req.params;

  try {
    const email = await prisma.inboundEmail.findUnique({ where: { id: emailId } });
    if (!email) {
      return res.status(404).json({ success: false, error: "Email not found" });
    }

    const prompt = `
      Based on the following email, generate a suggested reply.
      Subject: ${email.subject}
      Body: ${email.body}

      Return JSON with: "suggestedReply", "tone", "urgency", "reasoning", "confidence".
      Tone can be: "positive", "neutral", "negative", "urgent".
      Urgency can be: "high", "medium", "low".
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const suggestions = JSON.parse(completion.choices[0].message.content || "{}");

    // Log AI history
    const userId = (req as any).user?.id;
    if (userId) {
      await logAIInteraction(
        userId,
        `Generate suggestions for email: ${email.subject || "No subject"}`,
        JSON.stringify(suggestions),
        "inbox_suggestions",
        { emailId }
      ).catch(err => console.error("[AI History] Failed to log inbox suggestions:", err));
    }

    res.json({ success: true, data: suggestions });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to generate AI suggestions." });
  }
});

export default router;