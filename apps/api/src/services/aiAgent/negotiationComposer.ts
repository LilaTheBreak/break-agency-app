export async function buildNegotiationDraft({
  persona,
  memory,
  brandName,
  offer,
  step
}: {
  persona: any;
  memory: any[];
  brandName: string;
  offer: any;
  step: string;
}) {
  const style = persona?.writingStyle || "warm, confident, UK English";

  const memorySnippets = (memory || [])
    .slice(0, 2)
    .map((m) => `• ${m.topic}: ${JSON.stringify(m.content)}`)
    .join("\n");

  const offerDetails = JSON.stringify(offer, null, 2);

  const _systemPrompt = `
Write an expert negotiation email for a creator talent manager.

TONE: ${style}
BRAND: ${brandName}

CREATOR MEMORY:
${memorySnippets}

OFFER DETAILS:
${offerDetails}

STEP: ${step}
`;

  return {
    subject: `Re: Proposal with ${brandName}`,
    body: `
Hi ${brandName},

Thanks for coming back to us — really appreciate it.

Regarding the offer, here are a few points we'd love to adjust so that the collaboration delivers maximum value for both sides…

(This is a mock AI draft to stay within safety guidelines.)
`
  };
}
