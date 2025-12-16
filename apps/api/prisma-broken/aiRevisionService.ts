import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';

const revisionPrompt = (context: {
  originalScript: string;
  feedback: string;
}) => `
You are an AI script editor. Your task is to revise a script based on a set of feedback notes.

**Original Script:**
---
${context.originalScript}
---

**Feedback Notes:**
---
${context.feedback}
---

**Instructions:**
1.  **parseFeedbackIntoActions**: Analyze the feedback and summarize it into a list of concrete actions (e.g., "Change the opening hook," "Make the CTA clearer").
2.  **applyAIRevisions**: Rewrite the script to incorporate the feedback.

**JSON Output Schema:**
{
  "actions": ["string"],
  "revisedScript": "string",
  "summaryOfChanges": "string"
}
`;

/**
 * The main orchestrator for the AI revision pipeline.
 * @param contentItemId - The ID of the ContentItem to revise.
 */
export async function applyAIRevisions(contentItemId: string) {
  // 1. Load Context
  const contentItem = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    include: {
      versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
      feedback: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!contentItem || contentItem.versions.length === 0) {
    throw new Error('Content item or its latest version not found.');
  }

  const latestVersion = contentItem.versions[0];
  const feedbackText = contentItem.feedback.map(f => `${f.authorName}: ${f.comment}`).join('\n');

  // 2. Run AI Revision
  const result = await aiClient.json(revisionPrompt({
    originalScript: latestVersion.script || '',
    feedback: feedbackText,
  })) as any;

  // 3. Create a new ContentVersion with the revised script
  const newVersion = await prisma.contentVersion.create({
    data: {
      contentItemId: contentItem.id,
      versionNumber: latestVersion.versionNumber + 1,
      script: result.revisedScript,
      caption: latestVersion.caption, // Carry over old caption for now
      aiSuggestions: {
        summaryOfChanges: result.summaryOfChanges,
        actionsTaken: result.actions,
      },
    },
  });

  // 4. Reset approval status and clear feedback for the new version
  await prisma.contentItem.update({ where: { id: contentItemId }, data: { status: 'draft' } });
  await prisma.contentApproval.deleteMany({ where: { contentItemId } });

  console.log(`[AI REVISOR] Successfully created version ${newVersion.versionNumber} for content item ${contentItemId}.`);
  return newVersion;
}