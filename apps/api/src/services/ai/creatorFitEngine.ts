import { aiClient } from "./aiClient.js";

export async function predictCreatorBrandFit(creator: any, brandPrediction: any) {
  const prompt = `
You are a senior Talent Strategy Director.

Evaluate how strong this creator is for the brand's predicted campaign.

Creator:
${JSON.stringify(creator, null, 2)}

Brand Prediction:
${JSON.stringify(brandPrediction, null, 2)}

Return JSON exactly:
{
  "fitScore": 0-100,
  "predictedValue": number|null,
  "likelihood": 0-100,
  "confidence": 0-100,
  "reasons": string[]
}
  `;

  if ((aiClient as any)?.json) {
    return aiClient.json(prompt);
  }

  return {
    fitScore: 50,
    predictedValue: null,
    likelihood: 50,
    confidence: 50,
    reasons: ["AI client not configured; default values used"]
  };
}
