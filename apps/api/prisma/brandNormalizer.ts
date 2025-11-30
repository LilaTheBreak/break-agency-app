import { aiClient } from './aiClient.js';

const normalizerPrompt = (brandName: string) => `
Normalize the following brand name and find its official website.

Brand Name: "${brandName}"

Respond with JSON: { "normalizedName": "string", "website": "string" }
`;

/**
 * Normalizes a brand name to its canonical form and finds its website.
 */
export async function normalizeBrand(brandName: string) {
  try {
    const prompt = normalizerPrompt(brandName);
    return await aiClient.json(prompt) as { normalizedName: string; website: string };
  } catch (error) {
    console.error('[AI BRAND NORMALIZER ERROR]', error);
    return { normalizedName: brandName, website: `${brandName.toLowerCase().replace(/\s+/g, '')}.com` };
  }
}