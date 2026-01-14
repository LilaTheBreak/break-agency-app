import OpenAI from "openai";
import prisma from '../lib/prisma';
import { sendSlackAlert } from '../integrations/slack/slackClient';
import { dealExtractionQueue } from '../worker/queues';
import { safeEnv } from '../utils/safeEnv';

const OPENAI_API_KEY = safeEnv("OPENAI_API_KEY", "");
const OPENAI_MODEL = safeEnv("OPENAI_MODEL", "gpt-4o-mini");
const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export async function runEmailTriage(emailId: string) {
  const email = await prisma.inboundEmail.findUnique({ where: { id: emailId } });
  if (!email) throw new Error("Email not found");

  const prompt = `You are an AI agent for influencer talent managers.\nEmail:\n"${email.snippet || email.body || ""}"\n\nExtract the following strictly as JSON:\n{\n  "summary": string,\n  "category": one of ["deal", "event", "gifting", "press", "negotiation", "spam", "other"],\n  "urgency": "low" | "medium" | "high",\n  "deadline": string | null,\n  "brand": string | null,\n  "action": string,\n  "confidence": number (0-1)\n}`;

  if (!client) {
    const fallback = {
      summary: email.snippet || "",
      category: "other",
      urgency: "medium",
      deadline: null,
      brand: (email as any).from || (email as any).fromEmail || null,
      action: "Review manually.",
      confidence: 0.1
    };
    return prisma.inboundEmail.update({
      where: { id: emailId },
      data: {
        aiSummary: fallback.summary,
        aiCategory: fallback.category,
        aiUrgency: fallback.urgency,
        aiRecommendedAction: fallback.action,
        aiJson: fallback as any
      }
    });
  }

  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.2,
    messages: [{ role: "system", content: prompt }]
  });

  const parsed = JSON.parse(completion.choices[0].message?.content || "{}");

  const updated = await prisma.inboundEmail.update({
    where: { id: emailId },
    data: {
      aiSummary: parsed.summary,
      aiCategory: parsed.category,
      aiUrgency: parsed.urgency,
      aiRecommendedAction: parsed.action,
      aiJson: parsed as any
    }
  });

  if ((parsed.confidence ?? 1) < 0.2) {
    await sendSlackAlert("Low-confidence inbox triage", { emailId, category: parsed.category });
  }
  if (parsed.category === "deal") {
    await dealExtractionQueue.add("extract", { emailId });
  }

  return updated;
}
