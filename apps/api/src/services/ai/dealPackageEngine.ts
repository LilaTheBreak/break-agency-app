import { aiClient } from './aiClient.js';

export async function buildDealPackageAI({ brandPrediction, creator, context }: any) {
  const prompt = `
You are a senior brand strategist at a top creator agency.
Create a full influencer campaign package for the brand, tailored to this creator.

Brand Prediction:
${JSON.stringify(brandPrediction, null, 2)}

Creator:
${JSON.stringify(creator, null, 2)}

Context Notes:
${JSON.stringify(context || {}, null, 2)}

Return JSON EXACTLY in this structure:
{
  "campaignGoal": "...",
  "deliverables": [ { "type": "...", "description": "...", "quantity": 1 } ],
  "pricing": {
    "flatFee": number,
    "tieredOptions": [
       { "description": "...", "fee": number }
    ]
  },
  "concepts": [
     { "name": "...", "summary": "...", "execution": "...", "hook": "..." }
  ],
  "timeline": {
    "kickoff": "...",
    "contentDelivery": "...",
    "liveDate": "...",
    "reporting": "..."
  },
  "terms": {
     "usage": "...",
     "exclusivity": "...",
     "payment": "...",
     "revisionPolicy": "..."
  },
  "upsells": [
     { "name": "...", "description": "...", "fee": number }
  ]
}
  `;

  if ((aiClient as any)?.json) {
    return aiClient.json(prompt);
  }

  // Fallback mock
  return {
    campaignGoal: "Increase brand awareness",
    deliverables: [{ type: "reel", description: "One IG Reel", quantity: 1 }],
    pricing: { flatFee: 1000, tieredOptions: [] },
    concepts: [{ name: "Concept A", summary: "Brief", execution: "Details", hook: "Hook" }],
    timeline: { kickoff: "TBD", contentDelivery: "TBD", liveDate: "TBD", reporting: "TBD" },
    terms: { usage: "30d social", exclusivity: "None", payment: "Net 30", revisionPolicy: "1 round" },
    upsells: []
  };
}
