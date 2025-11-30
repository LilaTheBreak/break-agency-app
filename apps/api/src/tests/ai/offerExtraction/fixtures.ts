import { InboundEmail } from "@prisma/client";

export function buildEmailFixture(overrides: Partial<InboundEmail> = {}): InboundEmail {
  const base: InboundEmail = {
    id: "email_test",
    userId: "user_test",
    subject: "Option A: £1500 IG Reel + Story / Option B: £2500 Reel + Story + Usage",
    snippet: "Includes 3 months usage, 2 rounds of amends",
    body: "Launch window Jan 12-20. Exclusive with protein brands 30 days.",
    from: "brand@example.com",
    to: "creator@example.com",
    receivedAt: new Date(),
    classification: null,
    extractedData: null,
    dealDraftId: null,
    aiSummary: null,
    aiCategory: null,
    aiUrgency: null,
    aiRecommendedAction: null,
    aiDeadline: null,
    aiBrand: null,
    aiConfidence: null,
    aiJson: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  return { ...base, ...overrides };
}
