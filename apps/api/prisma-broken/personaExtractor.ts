import { aiClient } from '../aiClient.js';

const personaPrompt = (context: { contentSamples: string[] }) => `
You are an AI linguistic analyst. Based on the following content samples from a creator, extract their persona.

**Content Samples:**
---
${context.contentSamples.join('\n---\n')}
---

**Instructions:**
Analyze the text and provide a structured persona profile.
- **toneKeywords**: A comma-separated list of 3-5 adjectives describing the tone (e.g., "witty, informal, energetic").
- **writingStyle**: A short description of their writing style (e.g., "Uses short sentences and a lot of emojis.").
- **cannedPhrases**: Identify common opening and closing phrases they use.
- **disallowedPhrases**: Identify any topics or phrases they seem to actively avoid.

**JSON Output Schema:**
{
  "toneKeywords": "string",
  "writingStyle": "string",
  "cannedPhrases": { "openers": ["string"], "closers": ["string"] },
  "disallowedPhrases": ["string"]
}
`;

export async function extractPersonaFromContent(contentSamples: string[]) {
  try {
    return await aiClient.json(personaPrompt({ contentSamples }));
  } catch (error) {
    console.error('[AI PERSONA EXTRACTOR ERROR]', error);
    return { toneKeywords: 'neutral', writingStyle: 'standard', cannedPhrases: {}, disallowedPhrases: [] };
  }
}