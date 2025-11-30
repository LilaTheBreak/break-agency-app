import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';

/**
 * Gathers all necessary inputs for a content quality check.
 */
export async function buildContentInput(deliverableId: string) {
  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    include: {
      campaign: { include: { brandLinks: { include: { brand: { include: { policies: { include: { versions: { take: 1, orderBy: { version: 'desc' } } } } } } } } } },
      user: { include: { personaProfile: true } },
    },
  });
  if (!deliverable) throw new Error('Deliverable not found.');

  return {
    caption: deliverable.description,
    brandPolicy: deliverable.campaign?.brandLinks[0]?.brand.policies[0]?.versions[0]?.rules,
    creatorPersona: deliverable.user?.personaProfile,
  };
}

const qualityPrompt = (input: any) => `
You are an AI content quality assurance expert. Analyze the provided content against multiple quality vectors.

**Content Caption:**
"${input.caption}"

**Brand Policy:**
${JSON.stringify(input.brandPolicy, null, 2)}

**Creator Persona:**
${JSON.stringify(input.creatorPersona, null, 2)}

**Instructions:**
Provide scores (0-100) for each of the following vectors:
- **viralityScore**: How likely is this to go viral? Consider the hook, topic, and structure.
- **brandFitScore**: How well does this align with the brand's policy and tone?
- **optimisationScore**: How well is this optimized for the platform (e.g., hashtags, CTA)?
- **clarityScore**: How clear and easy to understand is the message?

Also, generate 3 actionable suggestions for improvement and 3 alternative hooks.

**JSON Output Schema:**
{
  "scores": { "viralityScore": "number", "brandFitScore": "number", "optimisationScore": "number", "clarityScore": "number" },
  "suggestions": ["string"],
  "hooks": ["string"]
}
`;

/**
 * Runs the full AI quality prediction suite.
 */
export async function predictContentQuality(input: any) {
  try {
    return await aiClient.json(qualityPrompt(input)) as any;
  } catch (error) {
    console.error('[AI CONTENT QUALITY ERROR]', error);
    return { scores: { viralityScore: 50, brandFitScore: 50, optimisationScore: 50, clarityScore: 50 }, suggestions: ['AI engine offline.'], hooks: [] };
  }
}

/**
 * Compiles the final quality score from sub-scores.
 */
export function compileQualityScore(scores: { [key: string]: number }): number {
  const weights = { viralityScore: 0.3, brandFitScore: 0.4, optimisationScore: 0.2, clarityScore: 0.1 };
  let totalScore = 0;
  for (const key in scores) {
    totalScore += (scores[key] || 0) * (weights[key] || 0);
  }
  return totalScore;
}