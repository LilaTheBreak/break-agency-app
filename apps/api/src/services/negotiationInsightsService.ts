import OpenAI from "openai";
import prisma from "../lib/prisma.js";
import { sendSlackAlert } from "../integrations/slack/slackClient.js";
import { safeEnv } from "../utils/safeEnv.js";

const OPENAI_API_KEY = safeEnv("OPENAI_API_KEY", "");
const OPENAI_MODEL = safeEnv("NEGOTIATION_MODEL", safeEnv("OPENAI_MODEL", "gpt-4o-mini"));
const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export async function generateNegotiationInsight(dealDraftId: string) {
  const draft = await prisma.dealDraft.findUnique({
    where: { id: dealDraftId },
    include: {
      email: true,
      user: true
    }
  });

  if (!draft) throw new Error("DealDraft not found");

  const prompt = `You are an elite influencer talent agent. Generate negotiation insights.\n\nINPUT EMAIL:\n---\n${draft.email?.snippet || ""}\n---\n\nDEAL DATA:\n${JSON.stringify(draft.rawJson || {}, null, 2)}\n\nReturn STRICT JSON:\n{\n  "recommendedRate": number | null,\n  "rateCurrency": "USD" | "GBP" | "EUR" | null,\n  "justification": string,\n  "redFlags": string[],\n  "softSignals": string[],\n  "negotiationScript": string,\n  "confidence": number,\n  "rawJson": {}\n}`;

  if (!client) {
    const fallback = {
      recommendedRate: null,
      rateCurrency: null,
      justification: "OpenAI key missing; manual negotiation required.",
      redFlags: [],
      softSignals: [],
      negotiationScript: "",
      confidence: 0.1,
      rawJson: {}
    };
    return prisma.negotiationInsight.create({
      data: {
        dealDraftId,
        ...fallback
      }
    });
  }

  const response = await client.chat.completions.create({
    model: OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.1,
    messages: [{ role: "user", content: prompt }]
  });

  const data = JSON.parse(response.choices[0]?.message?.content || "{}");

  const insight = await prisma.negotiationInsight.create({
    data: {
      dealDraftId,
      recommendedRate: data.recommendedRate,
      rateCurrency: data.rateCurrency,
      justification: data.justification,
      redFlags: data.redFlags,
      softSignals: data.softSignals,
      negotiationScript: data.negotiationScript,
      confidence: data.confidence,
      rawJson: data.rawJson ?? data
    }
  });

  if ((data.confidence ?? 1) < 0.2) {
    await sendSlackAlert("Negotiation insight low confidence", { dealDraftId });
  }

  return insight;
}
