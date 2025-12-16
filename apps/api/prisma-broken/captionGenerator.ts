import { aiClient } from '../ai/aiClient.js';

const captionPrompt = (context: { topic: string; tone: string }) => `
You are a viral social media copywriter. Generate 5 distinct, engaging captions for a post about "${context.topic}".
The desired tone is: ${context.tone}.

**Instructions:**
Include relevant hashtags in each caption.

**JSON Output Schema:**
{ "captions": ["string", "string", "string", "string", "string"] }
`;

/**
 * Generates a set of captions for a deliverable using AI.
 */
export async function generateCaptions(topic: string, tone: string = 'witty and informative') {
  try {
    return await aiClient.json(captionPrompt({ topic, tone })) as { captions: string[] };
  } catch (error) {
    console.error('[AI CAPTION GENERATOR ERROR]', error);
    return { captions: ['This is a stub caption. #stub'] };
  }
}