import OpenAI from "openai";
import prisma from "../../lib/prisma.js";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("[CRITICAL] OPENAI_API_KEY is not set in environment variables. AI services will fail.");
}
const openai = apiKey ? new OpenAI({ apiKey }) : null;
const AI_MODEL = "gpt-4o";

interface CreatorFitResult {
  score: number;
  breakdown: {
    audience: number;
    style: number;
    niche: number;
    values: number;
    safety: number;
    risk: number;
  };
  insights: any;
  aiSummary: string;
  aiJson: any;
  confidence: number;
}

export async function computeCreatorFit(
  talentId: string,
  brandId: string,
  campaignId?: string
): Promise<CreatorFitResult> {
  const talent = await prisma.talent.findUnique({ where: { id: talentId } });
  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  const campaign = campaignId ? await prisma.brandCampaign.findUnique({ where: { id: campaignId } }) : null;

  if (!talent || !brand) {
    throw new Error("Talent or Brand not found");
  }

  const prompt = `
    You are a senior Talent Strategy Director. Your task is to analyze the fit between a creator and a brand/campaign based on the provided data.

    **Creator Profile:**
    ${JSON.stringify(talent, null, 2)}

    **Brand Profile:**
    ${JSON.stringify(brand, null, 2)}

    ${campaign ? `**Campaign Brief:**\n${JSON.stringify(campaign, null, 2)}` : ""}

    **Instructions:**
    Evaluate the fit across several dimensions based on the provided weights. The totalScore should be the sum of these scores.

    **Return JSON with this exact structure:**
    {
      "audienceAlignment": "number (0-25, how well does the creator's audience match the brand's target demographic?)",
      "contentStyleMatch": "number (0-20, does the creator's content style and tone fit the brand?)",
      "nicheOverlap": "number (0-20, how much do their content niches overlap?)",
      "valuesAlignment": "number (0-20, do their stated values and mission align?)",
      "brandSafetyScore": "number (0-10, is the creator's content safe for this brand? 10 is perfectly safe)",
      "riskScore": "number (-5 to 5, what is the potential risk of this collaboration? -5 is high risk, 5 is low risk/high opportunity)",
      "totalScore": "number (0-100, the sum of all the above scores)",
      "aiSummary": "string (a brief explanation for your final score)",
      "insights": {},
      "confidence": "number (0.0-1.0, your confidence in this assessment)"
    }
  `;

  if (!openai) {
    console.error("[AI] OpenAI client not initialized");
    return {
      audienceAlignment: 0,
      contentStyleMatch: 0,
      nicheOverlap: 0,
      valuesAlignment: 0,
      brandSafetyScore: 0,
      riskScore: 0,
      totalScore: 0,
      aiSummary: "AI client not configured",
      insights: {},
      confidence: 0
    };
  }

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: "system", content: "You are an expert talent-brand strategist." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(completion.choices[0].message.content || "{}");

  // Save the result to the database
  await prisma.creatorFitScore.create({
    data: {
      id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      talentId,
      brandId,
      campaignId,
      totalScore: result.totalScore || 0,
      audienceScore: Math.round((result.audienceAlignment || 0) * 100),
      engagementScore: Math.round((result.contentStyleMatch || 0) * 100),
      historyScore: Math.round((result.nicheOverlap || 0) * 100),
      categoryScore: Math.round((result.brandSafetyScore || 0) * 100),
      explanation: result.aiSummary,
      calculationDetails: result,
    },
  });

  return {
    score: result.totalScore,
    breakdown: {
      audience: Math.round((result.audienceScore || 0)),
      style: Math.round((result.engagementScore || 0)),
      niche: Math.round((result.historyScore || 0)),
      values: Math.round((result.categoryScore || 0)),
      safety: result.brandSafetyScore,
      risk: result.riskScore,
    },
    insights: result.insights,
    aiSummary: result.aiSummary,
    aiJson: result,
    confidence: result.confidence,
  };
}
