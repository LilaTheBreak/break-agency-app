import { aiClient } from './aiClient.js';

const analysisPrompt = (context: { creatorProfile: any; competitorPosts: any[] }) => `
You are a top-tier social media strategist. Analyze the provided competitor content and compare it to our creator's profile.

**Our Creator's Niche:**
${context.creatorProfile.bio}

**Competitor's Recent Posts:**
---
${context.competitorPosts.map(p => `Caption: ${p.caption}`).join('\n---\n')}
---

**Instructions:**
Based on the competitor's content, provide a strategic analysis.
- **themes**: What are the dominant content themes or topics?
- **strengths**: What are they doing well?
- **weaknesses**: Where are the opportunities for our creator to do better?
- **counterContentIdeas**: Suggest 2-3 specific content ideas for our creator to counter-program or capitalize on a trend.

**JSON Output Schema:**
{
  "themes": ["string"],
  "strengths": ["string"],
  "weaknesses": ["string"],
  "counterContentIdeas": ["string"]
}
`;

export async function analyzeCompetitorContent(context: { creatorProfile: any; competitorPosts: any[] }) {
  const prompt = analysisPrompt(context);
  return aiClient.json(prompt).catch(() => ({ themes: [], strengths: [], weaknesses: [], counterContentIdeas: ['AI engine offline.'] }));
}