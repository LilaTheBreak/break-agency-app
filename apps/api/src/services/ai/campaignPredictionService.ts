import { aiClient } from "./aiClient.js";

export async function predictBrandCampaign(brand: any, signals: any) {
  const prompt = `
  You are an AI Brand Strategy Director.

  Analyse signals and predict whether the brand is preparing a campaign.

  Brand: ${brand.brandName}
  Signals:
  ${JSON.stringify(signals, null, 2)}

  Output strictly JSON:
  {
    "likelihood": 0-100,
    "predictedBudget": number|null,
    "predictedStage": "planning"|"briefing"|"outreach"|"live"|null,
    "predictedStart": "ISO date string"|null,
    "confidence": 0-100,
    "reasons": string[]
  }
  `;

  if ((aiClient as any)?.json) {
    return aiClient.json(prompt);
  }

  return {
    likelihood: brand?.likelihood ?? 50,
    predictedBudget: null,
    predictedStage: null,
    predictedStart: null,
    confidence: 50,
    reasons: ["AI client not configured; using defaults"]
  };
}
