import { aiClient } from "./aiClient.js";

export async function scoreBrandAffinity(events: any, brand: any, user: any) {
  const prompt = `
  You are an AI CRM engine evaluating the strength of the relationship between a creator/talent manager and a brand.

  Brand: ${brand?.brandName}
  User: ${user?.name || user?.id}

  Recent events:
  ${JSON.stringify(events, null, 2)}

  Output JSON:
  {
    affinityScore: number (0-100),
    likelihoodToClose: number (0-100),
    warm: boolean,
    reasons: string[]
  }
  `;

  if ((aiClient as any)?.json) {
    return aiClient.json(prompt);
  }

  return {
    affinityScore: brand?.affinityScore ?? 50,
    likelihoodToClose: brand?.likelihoodToClose ?? 50,
    warm: false,
    reasons: ["AI client not configured; using defaults"]
  };
}
