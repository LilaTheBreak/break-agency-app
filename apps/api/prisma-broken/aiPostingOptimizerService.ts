import { aiClient } from './aiClient.js';

const optimizerPrompt = (context: {
  platform: string;
  creatorFollowerData: any;
}) => `
You are an AI social media strategist. Your task is to predict the best times to post for a specific creator on a given platform.

**Context:**
- **Platform:** ${context.platform}
- **Creator's Audience Data (Timezones & Activity):** ${JSON.stringify(context.creatorFollowerData, null, 2)}

**Instructions:**
Based on the audience data, predict the top 3 best posting slots for the next 7 days. Provide a justification for each.

**JSON Output Schema:**
{
  "bestTimes": [
    { "time": "ISO_8601_DateTime", "justification": "string", "estimatedLift": "number (0.0-1.0)" },
    { "time": "ISO_8601_DateTime", "justification": "string", "estimatedLift": "number (0.0-1.0)" },
    { "time": "ISO_8601_DateTime", "justification": "string", "estimatedLift": "number (0.0-1.0)" }
  ]
}
`;

/**
 * Predicts the best times for a creator to post on a specific platform.
 */
export async function predictBestTimes(platform: string, creatorId: string) {
  // In a real app, you would fetch real audience analytics for the creator.
  const creatorFollowerData = {
    timezoneDistribution: { 'America/New_York': 0.4, 'America/Los_Angeles': 0.3, 'Europe/London': 0.2 },
    peakActivityHoursUTC: [1, 15, 20],
  };

  try {
    const prompt = optimizerPrompt({ platform, creatorFollowerData });
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI OPTIMIZER ERROR]', error);
    // Return a safe stub if AI fails
    const now = new Date();
    return {
      bestTimes: [{ time: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(), justification: 'Stubbed: 24 hours from now.', estimatedLift: 0.05 }],
    };
  }
}