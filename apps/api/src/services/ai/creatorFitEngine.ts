import OpenAI from "openai";
import prisma from "../../lib/prisma.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
      talentId,
      brandId,
      campaignId,
      audienceAlignment: result.audienceAlignment,
      contentStyleMatch: result.contentStyleMatch,
      nicheOverlap: result.nicheOverlap,
      valuesAlignment: result.valuesAlignment,
      brandSafetyScore: result.brandSafetyScore,
      riskScore: result.riskScore,
      totalScore: result.totalScore,
      aiSummary: result.aiSummary,
      aiJson: result,
    },
  });

  return {
    ok: true,
    score: result.totalScore,
    breakdown: {
      audience: result.audienceAlignment,
      style: result.contentStyleMatch,
      niche: result.nicheOverlap,
      values: result.valuesAlignment,
      safety: result.brandSafetyScore,
      risk: result.riskScore,
    },
    insights: result.insights,
    aiSummary: result.aiSummary,
    aiJson: result,
    confidence: result.confidence,
  };
}
