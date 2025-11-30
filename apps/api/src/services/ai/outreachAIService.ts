export async function generateLeadProspects(user: any, niche: string, count = 25) {
  const prompt = `
Generate ${count} brand prospect leads for a creator in the niche: ${niche}.
Return JSON with: brandName, brandWebsite, industry, brandEmail(if public).
User: ${user?.name || "Talent Manager"}
`;

  if ((global as any).aiClient?.json) {
    return (global as any).aiClient.json(prompt);
  }

  // Fallback mock
  return Array.from({ length: count }).map((_, i) => ({
    brandName: `Prospect ${i + 1}`,
    brandWebsite: "https://example.com",
    industry: niche || "general",
    brandEmail: `contact${i + 1}@example.com`,
    score: 50
  }));
}

export async function generateOutreachSequence(lead: any, user: any) {
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
  if ((global as any).aiClient?.json) return (global as any).aiClient.json(prompt);

  return {
    steps: [
      { delayHours: 0, template: `Hi ${lead?.brandName}, we'd love to collaborate.` },
      { delayHours: 48, template: "Following up on our note." },
      { delayHours: 96, template: "Checking in once more." },
      { delayHours: 144, template: "Final nudge before we close this thread." }
    ]
  };
}

export async function generateFollowUpMessage(previousMessage: string, lead: any) {
  const prompt = `
Generate a follow-up outreach message.
Previous message: ${previousMessage}
Brand: ${lead?.brandName}
Keep it short, friendly, and non-invasive.
`;
  if ((global as any).aiClient?.text) return (global as any).aiClient.text(prompt);
  return `Just bumping this thread for ${lead?.brandName}!`;
}
