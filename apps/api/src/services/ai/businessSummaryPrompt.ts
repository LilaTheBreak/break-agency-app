// services/ai/businessSummaryPrompt.ts

/**
 * Data structure for any business metrics used in summary generation.
 */
export interface BusinessMetrics {
  totalRevenue?: number;
  newDeals?: number;
  closedDeals?: number;
  inboxVolume?: number;
  activeCampaigns?: number;
  topPerformers?: string[];
  period?: string; // "this month", "last 7 days", etc.
}

/**
 * Builds the standardized prompt for AI-generated business summaries.
 */
export function buildBusinessSummaryPrompt(metrics: BusinessMetrics) {
  const {
    totalRevenue = 0,
    newDeals = 0,
    closedDeals = 0,
    inboxVolume = 0,
    activeCampaigns = 0,
    topPerformers = [],
    period = "the recent period",
  } = metrics;

  return `
You are an AI assistant generating an executive business summary for The Break Agency.

The summary should be:
- Clear, concise, and professional
- Insightful, highlighting successes + areas for improvement
- Actionable, with suggested next steps
- Written in British English
- No emojis or casual language

Below is the company performance data for **${period}**:

• Total Revenue: £${totalRevenue.toLocaleString()}
• New Deals Started: ${newDeals}
• Deals Closed: ${closedDeals}
• Inbox Volume (brand emails): ${inboxVolume}
• Active Campaigns: ${activeCampaigns}
• Top Performing Talent: ${topPerformers.length ? topPerformers.join(", ") : "N/A"}

Now generate:

1. A short executive summary  
2. Three key wins  
3. Three risks or challenges  
4. Three recommended actions for the team  
5. A concluding “focus statement” for leadership

Write in paragraph form with short, skimmable sections.
  `;
}

export default buildBusinessSummaryPrompt;
