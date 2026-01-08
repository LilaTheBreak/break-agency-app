import { InboundEmail } from "@prisma/client";

export function buildEmailFixture(overrides: Partial<InboundEmail> = {}): InboundEmail {
  const base: InboundEmail = {
    id: "email_test",
    userId: "user_test",
    inboxMessageId: null,
    platform: "gmail",
    subject: "Option A: £1500 IG Reel + Story / Option B: £2500 Reel + Story + Usage",
    body: "Launch window Jan 12-20. Exclusive with protein brands 30 days.",
    fromEmail: "brand@example.com",
    toEmail: "creator@example.com",
    gmailId: null,
    instagramId: null,
    tiktokId: null,
    whatsappId: null,
    threadId: null,
    receivedAt: new Date(),
    direction: "inbound",
    isRead: false,
    categories: [],
    metadata: null,
    aiSummary: null,
    aiCategory: null,
    aiUrgency: null,
    aiRecommendedAction: null,
    aiConfidence: null,
    aiJson: null,
    snippet: null,
    dealId: null,
    talentId: null,
    brandId: null,
  };
  return { ...base, ...overrides };
}
