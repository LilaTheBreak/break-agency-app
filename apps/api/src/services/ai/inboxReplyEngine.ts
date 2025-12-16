import OpenAI from "openai";
import { buildInboxReplyPrompt } from "../../prompts/inboxReplyPrompt";
import { trackAITokens } from "./tokenTracker";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
  const prompt = buildInboxReplyPrompt(input);
  let tokens = 0;

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: "You are an expert email assistant for a talent manager." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
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
