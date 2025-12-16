import { aiClient } from './aiClient.js';

const summaryPrompt = (context: { timeframe: string; emails: any[] }) => `
You are an executive assistant AI for a busy talent agent. Your task is to summarize the inbox activity for the last ${context.timeframe}.

**Recent Inbox Activity:**
---
${context.emails.map(e => `- From: ${e.from}, Subject: ${e.subject}, Category: ${e.aiCategory}, Urgency: ${e.aiUrgency}`).join('\n')}
---

**Instructions:**
Analyze the activity and provide a concise, high-level summary.
- **summary**: A one-paragraph overview of what's happened.
- **insights**: 1-2 interesting observations (e.g., "Brand X seems very eager," "Multiple inquiries about TikTok content").
- **actions**: A list of the top 3-5 most urgent, actionable items for the user.
- **stats**: Key numbers like new leads, urgent emails, and upcoming deadlines.

**JSON Output Schema:**
{
  "summary": "string",
  "insights": ["string"],
  "actions": [{ "action": "string", "context": "string", "emailId": "string" }],
  "stats": { "newLeads": "number", "urgentEmails": "number", "deadlinesToday": "number" }
}
`;

/**
 * Generates a summary of inbox activity using AI.
 */
export async function generateInboxSummary(context: { timeframe: string; emails: any[] }) {
  try {
    const prompt = summaryPrompt(context);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI INBOX SUMMARIZER ERROR]', error);
    return { summary: 'AI summary is currently unavailable.', insights: [], actions: [], stats: {} };
  }
}