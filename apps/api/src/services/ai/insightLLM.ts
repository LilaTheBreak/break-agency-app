import OpenAI from "openai";
import { buildBusinessSummaryPrompt } from '../../prompts/businessSummaryPrompt.js';
import { trackAITokens } from './tokenTracker.js';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("[CRITICAL] OPENAI_API_KEY is not set in environment variables. AI services will fail.");
}
const openai = apiKey ? new OpenAI({ apiKey }) : null;
const AI_MODEL = "gpt-4o";

interface BusinessSummary {
  healthScore: number;
  risks: string[];
  opportunities: string[];
  recommendations: string[];
  summary: string;
}

export async function generateBusinessSummary(insightsData: any) {
  const start = Date.now();
  const prompt = buildBusinessSummaryPrompt(insightsData);
  let tokensUsed = 0;

  if (!openai) {
    console.error("[AI] OpenAI client not initialized - API key missing");
    const latency = Date.now() - start;
    return {
      ok: false,
      error: "AI service unavailable - provider not configured",
      data: {
        healthScore: 0,
        risks: ["AI provider not configured"],
        opportunities: [],
        recommendations: [],
        summary: "AI service is not available. Please contact an administrator.",
      },
      meta: {
        tokens: 0,
        latency,
      },
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: "You are an expert business analyst for a talent agency." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    tokensUsed = completion.usage?.total_tokens ?? 0;
    await trackAITokens({ service: "generateBusinessSummary", tokens: tokensUsed });
    const latency = Date.now() - start;
    const parsed = JSON.parse(completion.choices[0].message.content || "{}") as BusinessSummary;

    return {
      ok: true,
      data: parsed,
      meta: {
        tokens: tokensUsed,
        latency,
      },
    };
  } catch (error) {
    console.error("Error generating business summary:", error);
    const latency = Date.now() - start;
    await trackAITokens({ service: "generateBusinessSummary", tokens: tokensUsed });
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
      data: {
        healthScore: 50,
        risks: ["AI analysis failed"],
        opportunities: [],
        recommendations: [],
        summary: "Could not generate AI summary.",
      },
      meta: {
        tokens: tokensUsed,
        latency,
      },
    };
  }
}
