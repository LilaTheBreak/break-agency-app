import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';

const shotListGeneratorPrompt = (context: {
  conceptName: string;
  conceptDescription: string;
  scriptOutline: string[];
  platform: string;
}) => `
You are an AI cinematographer and director. Your task is to take a creative concept and a script outline and generate a detailed shot list for a social media video.

**Creative Concept:**
- **Name:** ${context.conceptName}
- **Description:** ${context.conceptDescription}
- **Platform:** ${context.platform}

**Script Outline:**
${context.scriptOutline.map((s, i) => `${i + 1}. ${s}`).join('\n')}

**Instructions:**
For each point in the script outline, generate a corresponding shot. Provide a detailed description, camera angle, lighting suggestion, and any necessary props. The output must be a JSON array of shot objects.

**JSON Output Schema:**
[
  {
    "shotNumber": "number",
    "shotType": "string (e.g., 'Wide Shot', 'Medium Close-Up', 'Point-of-View')",
    "description": "string (A detailed description of the action in the shot)",
    "cameraAngle": "string (e.g., 'Eye-level', 'Low-angle looking up')",
    "lighting": "string (e.g., 'Bright, natural light', 'Dramatic, high-contrast')",
    "props": ["string"],
    "notes": "string (Any extra notes for the creator)"
  }
]
`;

/**
 * The main orchestrator for the AI shot list generation pipeline.
 * @param conceptId - The ID of the CreativeConcept to generate a shot list for.
 */
export async function generateShotList(conceptId: string) {
  // 1. Load Context
  const concept = await prisma.creativeConcept.findUnique({ where: { id: conceptId } });

  if (!concept) {
    throw new Error('Creative concept not found.');
  }

  // 2. Run AI Shot List Generation
  const result = await aiClient.json(shotListGeneratorPrompt({
    conceptName: concept.conceptName || 'Untitled Concept',
    conceptDescription: concept.conceptDescription || '',
    scriptOutline: (concept.scriptOutline as string[]) || [],
    platform: concept.platform,
  })) as any[];

  // 3. Delete old shots and save the new ones
  await prisma.creativeShotList.deleteMany({ where: { conceptId } });

  const shotsData = result.map(shot => ({
    conceptId,
    shotNumber: shot.shotNumber,
    shotType: shot.shotType,
    description: shot.description,
    cameraAngle: shot.cameraAngle,
    lighting: shot.lighting,
    props: shot.props,
    notes: shot.notes,
  }));

  await prisma.creativeShotList.createMany({ data: shotsData });

  console.log(`[AI SHOT LIST] Successfully generated ${shotsData.length} shots for concept ${conceptId}.`);
  return shotsData;
}