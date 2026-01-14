import { aiClient } from './aiClient';

export async function buildCreatorBundleAI({ brandPrediction, creators }: any) {
  const prompt = `
You are a senior influencer strategist at a global creative agency.
Create a full multi-tier campaign lineup for the brand.

Brand Prediction:
${JSON.stringify(brandPrediction, null, 2)}

Candidate Creators:
${JSON.stringify(creators, null, 2)}

Return JSON EXACTLY like:
{
  "bronze": {
     "title": "Starter Pack",
     "creators": [ { "id": "...", "reason": "...", "estimatedFee": 0 } ],
     "totalEstimated": 0
  },
  "silver": {
     "title": "Growth Pack",
     "creators": [...],
     "totalEstimated": 0
  },
  "gold": {
     "title": "Hero Pack",
     "creators": [...],
     "heroTalent": { "id": "...", "reason": "...", "estimatedFee": 0 },
     "totalEstimated": 0
  }
}
  `;

  if ((aiClient as any)?.json) {
    return aiClient.json(prompt);
  }

  return {
    bronze: { title: "Starter Pack", creators: [], totalEstimated: 0 },
    silver: { title: "Growth Pack", creators: [], totalEstimated: 0 },
    gold: { title: "Hero Pack", creators: [], heroTalent: null, totalEstimated: 0 }
  };
}
