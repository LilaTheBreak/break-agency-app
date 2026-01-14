import { trackAITokens } from './tokenTracker';

function envelope(data: any, tokens: number, latency: number, ok = true) {
  return {
    ok,
    data,
    meta: {
      tokens,
      latency,
    },
  };
}

export async function generateLeadProspects(user: any, niche: string, count = 25) {
  const start = Date.now();
  const prompt = `
Generate ${count} brand prospect leads for a creator in the niche: ${niche}.
Return JSON with: brandName, brandWebsite, industry, brandEmail(if public).
User: ${user?.name || "Talent Manager"}
`;
  let tokens = 0;

  const result =
    (global as any).aiClient?.json
      ? await (global as any).aiClient.json(prompt).catch(() => null)
      : null;

  const data =
    result ||
    Array.from({ length: count }).map((_, i) => ({
      brandName: `Prospect ${i + 1}`,
      brandWebsite: "https://example.com",
      industry: niche || "general",
      brandEmail: `contact${i + 1}@example.com`,
      score: 50,
    }));

  const latency = Date.now() - start;
  await trackAITokens({ service: "generateLeadProspects", tokens });
  return envelope(data, tokens, latency);
}

export async function generateOutreachSequence(lead: any, user: any) {
  const start = Date.now();
  const prompt = `
Create a 4-step cold outreach sequence for talent manager ${user?.name || "Talent Manager"}.
Lead brand: ${lead?.brandName}. Industry: ${lead?.industry}.
Produce:
 - email templates
 - delays
 - subject lines
 - CTA to book intro call
Return JSON steps with { delayHours, template }.
`;
  let tokens = 0;

  const result =
    (global as any).aiClient?.json
      ? await (global as any).aiClient.json(prompt).catch(() => null)
      : null;

  const data =
    result || {
      steps: [
        { delayHours: 0, template: `Hi ${lead?.brandName}, we'd love to collaborate.` },
        { delayHours: 48, template: "Following up on our note." },
        { delayHours: 96, template: "Checking in once more." },
        { delayHours: 144, template: "Final nudge before we close this thread." },
      ],
    };

  const latency = Date.now() - start;
  await trackAITokens({ service: "generateOutreachSequence", tokens });
  return envelope(data, tokens, latency);
}

export async function generateFollowUpMessage(previousMessage: string, lead: any) {
  const start = Date.now();
  const prompt = `
Generate a follow-up outreach message.
Previous message: ${previousMessage}
Brand: ${lead?.brandName}
Keep it short, friendly, and non-invasive.
`;
  let tokens = 0;

  const result =
    (global as any).aiClient?.text
      ? await (global as any).aiClient.text(prompt).catch(() => null)
      : null;

  const data = result || `Just bumping this thread for ${lead?.brandName}!`;
  const latency = Date.now() - start;
  await trackAITokens({ service: "generateFollowUpMessage", tokens });
  return envelope(data, tokens, latency);
}
