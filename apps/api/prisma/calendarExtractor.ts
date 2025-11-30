import { aiClient } from './aiClient.js';

const extractorPrompt = (text: string) => `
Analyze the following text and extract any event details.

Text: "${text}"

Respond with a JSON object with the following schema. Use null for any missing fields.
{
  "title": "string",
  "startTime": "ISO 8601 DateTime string",
  "endTime": "ISO 8601 DateTime string",
  "location": "string | null",
  "description": "A brief summary of the event."
}
`;

/**
 * Extracts structured event data from a block of text using AI.
 * @param text - The raw text from an email or message.
 * @returns A promise that resolves to the structured event data.
 */
export async function extractEventFromText(text: string) {
  const prompt = extractorPrompt(text);
  const result = await aiClient.json(prompt);
  return result;
}