import { dealExtractionSchema } from '../ai/schemas/dealExtractionSchema.js';
import { safeModel } from './ai/aiClient.js';
import { sendSlackAlert } from '../integrations/slack/slackClient.js';

export async function extractDealTerms({ text }: { text: string }) {
  try {
    const prompt = `You are an AI assistant extracting NON-BINDING, high-level summaries of deal terms from user-provided text. Do NOT give legal advice. Do NOT recommend negotiation tactics. Only restate what is present.

Return JSON ONLY, following this schema (stringify fields where appropriate):
${dealExtractionSchema.toString()}

TEXT TO ANALYSE:
${text}`;

    const aiResponse = await safeModel(prompt);
    const parsed = dealExtractionSchema.parse(aiResponse);
    return parsed;
  } catch (error) {
    await sendSlackAlert("Deal extraction failure", { error: `${error}` });
    throw error;
  }
}
