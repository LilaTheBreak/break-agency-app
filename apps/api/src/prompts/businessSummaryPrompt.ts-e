// apps/api/src/prompts/businessSummaryPrompt.ts

/**
 * Builds a business summary LLM prompt.
 */
export function buildBusinessSummaryPrompt(data: {
  totalRevenue?: number;
  newDeals?: number;
  inboxVolume?: number;
} = {}) {
  return `
Provide a concise business summary for the agency.
Metrics:
- Revenue: £${data.totalRevenue ?? "n/a"}
- New Deals: ${data.newDeals ?? "n/a"}
- Inbox Volume: ${data.inboxVolume ?? "n/a"}
Give actionable insights in < 120 words.
  `;
}
