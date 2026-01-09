import OpenAI from "openai";
import { buildInboxReplyPrompt } from "../../prompts/inboxReplyPrompt.js";
import { trackAITokens } from "./tokenTracker.js";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("[CRITICAL] OPENAI_API_KEY is not set in environment variables. AI services will fail.");
}
const openai = apiKey ? new OpenAI({ apiKey }) : null;
const AI_MODEL = "gpt-4o";

export interface ReplyGenerationInput {
  emailBody: string;
  senderName: string;
  recipientName: string;
  goal: "accept" | "decline" | "negotiate" | "clarify";
}

export interface ReplyVariations {
  professional: { subject: string; body: string };
  friendly: { subject: string; body: string };
  concise: { subject: string; body: string };
}

export async function generateReplyVariations(input: ReplyGenerationInput) {
  const start = Date.now();
  const prompt = buildInboxReplyPrompt(input as any);
  let tokens = 0;

  if (!openai) {
    console.error("[AI] OpenAI client not initialized");
    const latency = Date.now() - start;
    const fallback: ReplyVariations = {
      professional: { subject: "Re:", body: "AI service unavailable - provider not configured." },
      friendly: { subject: "Re:", body: "AI service unavailable - provider not configured." },
      concise: { subject: "Re:", body: "AI service unavailable - provider not configured." },
    };
    return {
      ok: false,
      error: "AI_CLIENT_UNAVAILABLE",
      data: fallback,
      meta: { tokens: 0, latency },
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    tokens = completion.usage?.total_tokens ?? 0;
    const payload = JSON.parse(completion.choices[0].message.content || "{}") as ReplyVariations;
    const latency = Date.now() - start;
    await trackAITokens({ service: "generateReplyVariations", tokens });

    return {
      ok: true,
      data: payload,
      meta: { tokens, latency },
    };
  } catch (error) {
    console.error("Error generating reply variations:", error);
    const latency = Date.now() - start;
    await trackAITokens({ service: "generateReplyVariations", tokens });

    const fallback: ReplyVariations = {
      professional: { subject: "Re:", body: "Could not generate AI reply." },
      friendly: { subject: "Re:", body: "Could not generate AI reply." },
      concise: { subject: "Re:", body: "Could not generate AI reply." },
    };

    return {
      ok: false,
      data: fallback,
      meta: { tokens, latency },
    };
  }
}
