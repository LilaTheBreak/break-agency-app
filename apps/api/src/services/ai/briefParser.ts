import { aiClient } from './aiClient';

export async function parseBrandBrief(raw: string) {
  const prompt = `
Extract structured meaning from the following influencer marketing brief:

${raw}

Return JSON ONLY with:
{
  "summary": "",
  "keywords": [],
  "categories": [],
  "tone": "",
  "deliverables": [],
  "idealCreators": {
     "platforms": [],
     "styles": [],
     "audience": []
  },
  "budget": {
     "min": 0,
     "max": 0
  }
}
  `;
  if ((aiClient as any)?.json) {
    return aiClient.json(prompt);
  }
  return {
    summary: "",
    keywords: [],
    categories: [],
    tone: "",
    deliverables: [],
    idealCreators: { platforms: [], styles: [], audience: [] },
    budget: { min: 0, max: 0 }
  };
}
