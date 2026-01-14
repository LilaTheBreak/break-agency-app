import { aiClient } from './aiClient';

export async function matchCreatorsToBrief({ brief, creators }: any) {
  const prompt = `
You are a senior influencer strategist.
Match creators to the brief based on:

- content style
- audience demographics
- platform performance
- category fit
- brand tone
- budget fit

Return STRICT JSON:
[
  {
    "creatorId": "",
    "score": 0.0,
    "reason": "",
    "predictedFee": 0,
    "predictedPerformance": {
       "reach": 0,
       "engagementRate": 0
    }
  }
]
`;

  if ((aiClient as any)?.json) {
    return aiClient.json(prompt);
  }

  return [];
}
