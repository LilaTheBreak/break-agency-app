import { aiClient } from './aiClient.js';

const pitchDeckPrompt = (context: any) => `
You are a pitch deck specialist. Create the content for a 3-slide pitch deck for a creator-brand collaboration.

Context: ${JSON.stringify(context)}

Respond with JSON containing an array of slides: { "slides": [{ "title": "string", "content": "string", "visualSuggestion": "string" }] }
`;

/**
 * Generates the content for a multi-slide pitch deck.
 */
export async function generatePitchDeck(context: { creatorProfile: any; brandProfile: any; matchScore: any }) {
  try {
    const prompt = pitchDeckPrompt(context);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI PITCH DECK ERROR]', error);
    return {
      slides: [{ title: 'Stub Slide', content: 'This is stubbed content.', visualSuggestion: 'A generic stock photo.' }],
    };
  }
}