import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';

const pitchGeneratorPrompt = (context: {
  pitchType: string;
  personaMode: string;
  brandName: string;
  creatorPersona: any;
  briefSummary?: string;
  dealContext?: any;
  creatorInsights?: any;
}) => `
You are an AI Brand Strategist for a top-tier talent agency. Your task is to generate a compelling, creative, and data-driven brand pitch.

**Pitch Context:**
- **Pitch Type:** ${context.pitchType}
- **Brand:** ${context.brandName}
- **Persona Mode:** ${context.personaMode} (The voice to write in)
- **Creator Persona:** ${JSON.stringify(context.creatorPersona, null, 2)}
- **Brief Summary:** ${context.briefSummary || 'N/A'}
- **Past Deal Context:** ${JSON.stringify(context.dealContext) || 'N/A'}
- **Creator Insights:** ${JSON.stringify(context.creatorInsights) || 'N/A'}

**Instructions:**
Generate a comprehensive, structured JSON pitch.
1.  **campaignConcept**: A catchy, one-sentence concept for the campaign.
2.  **creativeAngle**: A paragraph explaining the creative approach, tailored to the brand and creator.
3.  **deliverables**: A list of suggested deliverables (e.g., "3x TikToks, 1x Instagram Story").
4.  **hooks**: 3-5 engaging hooks for the content.
5.  **timeline**: A high-level estimated timeline (e.g., "4 weeks from kickoff to final post").
6.  **cta**: A clear call-to-action for the brand.
7.  **pitchEmailBody**: The full text of the pitch email, written in the specified persona mode.

**JSON Output Schema:**
{
  "campaignConcept": "string",
  "creativeAngle": "string",
  "deliverables": ["string"],
  "hooks": ["string"],
  "timeline": "string",
  "cta": "string",
  "pitchEmailBody": "string"
}
`;

/**
 * Checks if a user has permission to generate pitches.
 */
export function canGeneratePitches(user: any): boolean {
  const userRoles = user.roles?.map((r: any) => r.role.name) || [];
  const allowedRoles = ['super_admin', 'admin', 'exclusive_talent', 'talent', 'founder', 'brand_premium'];
  return userRoles.some((role: string) => allowedRoles.includes(role));
}

/**
 * The main orchestrator for the AI brand pitch generation pipeline.
 */
export async function generateBrandPitch({ user, brandName, briefId, dealId, type, personaMode }: { user: any; brandName: string; briefId?: string; dealId?: string; type: string; personaMode: string }) {
  // 1. Role Gating
  if (!canGeneratePitches(user)) {
    throw new Error('User does not have permission to generate brand pitches.');
  }

  // 2. Load Context
  const brief = briefId ? await prisma.brandBrief.findUnique({ where: { id: briefId } }) : null;
  const deal = dealId ? await prisma.dealThread.findUnique({ where: { id: dealId } }) : null;
  const persona = await prisma.creatorPersonaProfile.findUnique({ where: { userId: user.id } });
  const insights = await prisma.creatorInsights.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });

  const contextBundle = {
    pitchType: type,
    personaMode,
    brandName,
    creatorPersona: persona || {},
    briefSummary: brief?.aiSummary as string || undefined,
    dealContext: deal ? { stage: deal.stage, finalRate: deal.finalRate } : undefined,
    creatorInsights: insights ? { opportunities: insights.opportunities, risks: insights.risks } : undefined,
  };

  // 3. Call the AI Engine
  const result = await aiClient.json(pitchGeneratorPrompt(contextBundle)) as any;

  // 4. Store the PitchGeneration row
  const pitchGeneration = await prisma.pitchGeneration.create({
    data: {
      userId: user.id,
      brandName,
      briefId,
      dealId,
      personaId: persona?.id,
      type,
      inputContext: contextBundle,
      aiOutput: result,
    },
  });

  console.log(`[PITCH GENERATOR] Successfully generated '${type}' pitch for ${brandName}.`);
  return pitchGeneration;
}