import { Router, type Request, type Response } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { openai, generateChatCompletion } from "../lib/openai.js";
import { sendOutboundEmail } from "../services/email/sendOutbound.js"; // optional – only if Gmail send is implemented

const router = Router();

/**
 * POST /api/inbox/ai-reply
 *
 * Generates an AI-driven suggested reply to an inbound email.
 * Optional: auto-send the reply via Gmail.
 */
router.post("/api/inbox/ai-reply", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { emailId, prompt, autoSend } = req.body;

    if (!emailId) {
      return res.status(400).json({ ok: false, error: "emailId is required" });
    }

    // Fetch the email the user wants to reply to
    const email = await prisma.inboundEmail.findUnique({
      where: { id: emailId },
      include: {
        trackingEvents: true,
      }
    });

    if (!email) {
      return res.status(404).json({ ok: false, error: "Email not found" });
    }

    // --------------------------------------------------------------------
    // STEP 1: Build AI prompt
    // --------------------------------------------------------------------
    const basePrompt = `
You are an expert talent manager at The Break Agency.
Write a professional, concise reply to the following message.

Message details:
From: ${email.fromEmail}
To: ${email.toEmail ?? "our talent inbox"}
Subject: ${email.subject ?? "No subject"}

Body:
${email.body ?? ""}

Additional instruction from user:
${prompt ?? "(none)"}

Reply tone:
• Professional
• Clear
• Friendly but efficient
• Maintain brand safety
`;

    // --------------------------------------------------------------------
    // STEP 2: Generate AI reply
    // --------------------------------------------------------------------
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You write expert agency emails for talent, brands, and event partners." },
        { role: "user", content: basePrompt }
      ],
      max_tokens: 250,
      temperature: 0.4,
    });

    const aiReply =
      aiResponse.choices?.[0]?.message?.content?.trim() ??
      "(AI reply generation failed)";

    // --------------------------------------------------------------------
    // STEP 3: If autoSend = true → send via Gmail
    // --------------------------------------------------------------------
    let sendResult = null;

    if (autoSend) {
      try {
        sendResult = await sendOutboundEmail({
          userId,
          to: email.fromEmail,
          subject: `Re: ${email.subject ?? ""}`,
          html: `<p>${aiReply.replace(/\n/g, "<br>")}</p>`,
          threadId: email.threadId ?? undefined,
        });
      } catch (err) {
        console.error("AI REPLY SEND ERROR:", err);
        sendResult = { error: "Failed to send email" };
      }
    }

    // --------------------------------------------------------------------
    // STEP 4: Return result to UI
    // --------------------------------------------------------------------
    res.json({
      ok: true,
      reply: aiReply,
      sent: autoSend ? sendResult : null,
      emailId,
    });

  } catch (error) {
    console.error("AI REPLY ERROR:", error);
    res.status(500).json({ ok: false, error: "Failed to generate AI reply" });
  }
});

export default router;
