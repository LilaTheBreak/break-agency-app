import { loadAIContext } from "./aiContextService.js";
import prisma from "../../lib/prisma.js";

export async function generateOutreachMessage(userId: string, brandName: string) {
  const context = await loadAIContext(userId);
  const intel = await prisma.brandIntel.findFirst({
    where: { brandName: { equals: brandName, mode: "insensitive" } }
  });

  const persona = context.persona?.toneKeywords || "professional, warm";
  const style = context.persona?.writingStyle || "short, clear, UK English";

  const memoryHints = (context.memories || [])
    .slice(0, 3)
    .map((m) => `• ${m.topic}: ${JSON.stringify(m.content)}`)
    .join("\n");

  const brandNotes = intel?.notes ? JSON.stringify(intel.notes, null, 2) : "No prior brand intel.";

  const aiDraft = `
Write a personalised outreach message from a creator to a brand representative.

TONE: ${persona}
WRITING STYLE: ${style}
BRAND: ${brandName}

USER MEMORY:
${memoryHints}

BRAND NOTES:
${brandNotes}

GOAL: pitch a collaboration—short, warm, targeted, high-value.

Return JSON:
{
  "subject": "...",
  "message": "..."
}
`;

  return aiDraft;
}
