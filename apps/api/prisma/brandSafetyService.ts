import { aiClient } from '../aiClient.js';

const brandSafetyPrompt = (brandName: string, brandWebsite: string) => `
You are a brand safety analyst. Conduct a quick risk assessment of the following brand based on its name and website.

**Brand Name:** ${brandName}
**Website:** ${brandWebsite}

**Instructions:**
Identify any potential brand safety risks (e.g., association with gambling, adult content, political controversy, etc.).
Provide a safety score from 0 (high risk) to 100 (perfectly safe).

**JSON Output Schema:**
{ "brandSafetyScore": "number", "brandSafetyIssues": ["string"] }
`;

export async function checkBrand(brandName: string, brandWebsite: string) {
  try {
    const prompt = brandSafetyPrompt(brandName, brandWebsite);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI BRAND SAFETY ERROR]', error);
    return { brandSafetyScore: 50, brandSafetyIssues: ['AI engine offline.'] };
  }
}