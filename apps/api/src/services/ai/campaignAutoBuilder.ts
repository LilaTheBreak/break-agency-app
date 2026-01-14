import { aiClient } from './aiClient';

export async function buildCampaignPlan({ brief, creators }: any) {
  const prompt = `
You are a senior agency strategist.
Build a full influencer marketing campaign plan.

INPUT:
BRIEF: ${JSON.stringify(brief, null, 2)}
CREATORS: ${JSON.stringify(creators, null, 2)}

Return STRICT JSON:
{
  "summary": "",
  "deliverables": [
    {
      "creatorId": "",
      "platform": "",
      "type": "story|post|video",
      "rounds": 1,
      "dueDate": ""
    }
  ],
  "timeline": [
    {
      "week": 1,
      "title": "",
      "description": "",
      "dueDate": ""
    }
  ],
  "budget": {
    "creatorFees": [],
    "total": 0
  },
  "risks": [],
  "contracts": {
    "templatesNeeded": ["standard", "exclusivity", "whitelisting"],
    "notes": ""
  }
}
  `;

  if ((aiClient as any)?.json) {
    return aiClient.json(prompt);
  }

  return {
    summary: "",
    deliverables: [],
    timeline: [],
    budget: { creatorFees: [], total: 0 },
    risks: [],
    contracts: { templatesNeeded: [], notes: "" }
  };
}
