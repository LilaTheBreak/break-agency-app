import OpenAI from "openai";
import { trackAITokens } from './tokenTracker';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("[CRITICAL] OPENAI_API_KEY is not set in environment variables. AI services will fail.");
}
const openai = apiKey ? new OpenAI({ apiKey }) : null;
const AI_MODEL = "gpt-4o";

interface LLMSuitabilityAnalysis {
  contentAlignmentScore: number;
  brandToneMatch: number;
  conflictSentiment: number;
  warningSigns: string[];
  aiSummary: string;
  confidence: number;
}

export async function analyzeQualitativeSuitability(
  creatorProfile: any,
  brandProfile: any,
  campaignBrief?: any
) {
  const prompt = `
    You are an expert in brand-creator partnerships. Analyze the qualitative fit between the provided creator and brand/campaign.

    **Creator Profile:**
    ${JSON.stringify(creatorProfile, null, 2)}

    **Brand Profile:**
    ${JSON.stringify(brandProfile, null, 2)}

    ${campaignBrief ? `**Campaign Brief:**\n${JSON.stringify(campaignBrief, null, 2)}` : ""}

    Return a JSON object with this exact structure:
    {
      "contentAlignmentScore": "number (0-100, how well does creator's content align with brand's needs?)",
      "brandToneMatch": "number (0-100, how well does creator's tone match brand's tone?)",
      "conflictSentiment": "number (-1.0 to 1.0, overall sentiment regarding potential conflicts, -1 is high conflict)",
      "warningSigns": "string[] (e.g., ['past controversial content', 'brand mentions competitor'])",
      "aiSummary": "string (A brief summary of the qualitative fit)",
      "confidence": "number (0.0-1.0, your confidence in this assessment)"
    }
  `;

  const start = Date.now();
  let tokens = 0;

  if (!openai) {
    console.error("[AI] OpenAI client not initialized");
    const latency = Date.now() - start;
    await trackAITokens({ service: "analyzeQualitativeSuitability", tokens: 0 });
    return {
      ok: false,
      data: {
        contentAlignmentScore: 0,
        brandToneMatch: 0,
        conflictSentiment: 0,
        warningSigns: ["AI_CLIENT_UNAVAILABLE"],
        aiSummary: "AI client not configured",
        confidence: 0,
      },
      meta: { tokens: 0, latency },
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: "You are a top-tier brand-creator matchmaker." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    tokens = completion.usage?.total_tokens ?? 0;
    const payload = JSON.parse(completion.choices[0].message.content || "{}") as LLMSuitabilityAnalysis;
    const latency = Date.now() - start;
    await trackAITokens({ service: "analyzeQualitativeSuitability", tokens });

    return {
      ok: true,
      data: payload,
      meta: { tokens, latency },
    };
  } catch (error) {
    console.error("Error analyzing qualitative suitability:", error);
    const latency = Date.now() - start;
    await trackAITokens({ service: "analyzeQualitativeSuitability", tokens });

    return {
      ok: false,
      data: {
        contentAlignmentScore: 50,
        brandToneMatch: 50,
        conflictSentiment: 0,
        warningSigns: ["AI_ANALYSIS_FAILED"],
        aiSummary: "AI analysis failed.",
        confidence: 0.1,
      },
      meta: { tokens, latency },
    };
  }
}
