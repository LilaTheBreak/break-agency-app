import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';

const rewritePrompt = (context: {
  originalCaption: string;
  platform: string;
  options: {
    tone: string;
    style: string;
    keywords: string[];
  };
  creatorPersona: any;
}) => `
You are an AI social media expert specializing in optimizing content for different platforms. Your task is to rewrite a caption to maximize engagement on a specific platform.

**Creator Persona:**
- Tone: ${context.creatorPersona.toneKeywords}
- Style: ${context.creatorPersona.writingStyle}

**Rewrite Request:**
- **Platform:** ${context.platform}
- **Desired Tone:** ${context.options.tone}
- **Desired Style:** ${context.options.style}
- **Keywords to include:** ${context.options.keywords.join(', ')}

**Original Caption:**
"${context.originalCaption}"

**Instructions:**
Rewrite the caption according to the request.
1.  **rewrittenCaption**: Generate the new caption, tailored for the platform.
2.  **score**: Score the new caption (0-100) on its likely performance on the target platform.
3.  **risks**: Identify any potential risks (e.g., "Use of certain words might be flagged on ${context.platform}").
4.  **suggestions**: Provide one key suggestion for further improvement.

**JSON Output Schema:**
{
  "rewrittenCaption": "string",
  "score": "number",
  "risks": ["string"],
  "suggestions": ["string"]
}
`;

/**
 * The main orchestrator for the AI caption rewrite pipeline.
 * @param deliverableId - The ID of the deliverable to rewrite the caption for.
 * @param platform - The target platform (e.g., 'tiktok', 'linkedin').
 * @param options - The rewriting options (tone, style, etc.).
 */
export async function rewriteForPlatform(deliverableId: string, platform: string, options: any) {
  // 1. Load Context
  const deliverable = await prisma.deliverableItem.findUnique({
    where: { id: deliverableId },
    include: { deal: { include: { user: { include: { personaProfile: true } } } } },
  });

  if (!deliverable || !deliverable.deal.user) {
    throw new Error('Deliverable context is incomplete for caption rewrite.');
  }

  // 2. Run AI Rewrite
  const result = await aiClient.json(rewritePrompt({
    originalCaption: deliverable.caption || '',
    platform,
    options,
    creatorPersona: deliverable.deal.user.personaProfile || { toneKeywords: 'neutral', writingStyle: 'standard' },
  })) as any;

  // 3. Save the new rewrite to the database
  const rewrite = await prisma.captionRewrite.create({
    data: {
      deliverableId,
      platform,
      originalCaption: deliverable.caption,
      rewrittenCaption: result.rewrittenCaption,
      tone: options.tone,
      style: options.style,
      keywords: options.keywords,
      score: result.score,
      risks: result.risks,
      suggestions: result.suggestions,
      modelVersion: 'v1.0',
    },
  });

  console.log(`[AI REWRITER] Successfully generated new caption for deliverable ${deliverableId} on ${platform}.`);
  return rewrite;
}