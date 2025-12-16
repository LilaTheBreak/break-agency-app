import { aiClient } from '../aiClient.js';

const summaryPrompt = (emailBody: string) => `
You are a helpful assistant for a busy creator. Summarize the following email into a single, actionable sentence.

Email: "${emailBody.substring(0, 1000)}"

Respond with JSON: { "summary": "string" }
`;

const captionPrompt = (context: { topic: string; tone: string }) => `
You are a viral content expert. Generate 3 creative caption ideas for a social media post.

Topic: "${context.topic}"
Tone: "${context.tone}"

Respond with JSON: { "captions": ["string", "string", "string"] }
`;

const followupPrompt = (context: { emailSummary: string }) => `
Based on the following email summary, draft a short, polite follow-up suggestion that the creator can send.

Summary: "${context.emailSummary}"

Respond with JSON: { "followUpSuggestion": "string" }
`;

/**
 * Summarizes an email specifically for a creator's view.
 */
export async function summariseCreatorEmail(emailBody: string) {
  try {
    return await aiClient.json(summaryPrompt(emailBody)) as { summary: string };
  } catch (e) {
    return { summary: 'Could not generate summary. Please read the full email.' };
  }
}

/**
 * Generates caption ideas for a given topic.
 */
export async function generateCaptionIdeas(context: { topic: string; tone: string }) {
  try {
    return await aiClient.json(captionPrompt(context)) as { captions: string[] };
  } catch (e) {
    return { captions: ['Check out my new video! #stub', 'New content alert! #stub', 'You don\'t want to miss this! #stub'] };
  }
}

/**
 * Generates a follow-up suggestion for an email.
 */
export async function generateFollowUpSuggestions(context: { emailSummary: string }) {
  try {
    return await aiClient.json(followupPrompt(context)) as { followUpSuggestion: string };
  } catch (e) {
    return { followUpSuggestion: 'Thanks for the email, I will get back to you shortly.' };
  }
}