import { aiClient } from './aiClient.js';

export async function reviewDeliverable({ deliverable, content, brief }: any) {
  const prompt = `
You are an expert brand-safety reviewer and ad compliance officer.

Evaluate the creator deliverable.

BRIEF:
${JSON.stringify(brief, null, 2)}

DELIVERABLE META:
${JSON.stringify(deliverable, null, 2)}

CONTENT:
${content}

Return STRICT JSON:
{
  "summary": "",
  "score": 0,
  "issues": [
    {
      "type": "brand_safety|asa_ftc|claims|tone|visual|legal|missing_talking_points",
      "severity": "low|medium|high",
      "description": "",
      "recommendedFix": ""
    }
  ],
  "suggestions": []
}
  `;

  if ((aiClient as any)?.json) {
    return aiClient.json(prompt);
  }

  return {
    summary: "AI client not configured",
    score: 0,
    issues: [],
    suggestions: []
  };
}
