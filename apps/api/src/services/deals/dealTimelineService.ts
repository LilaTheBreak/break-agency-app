// services/deals/dealTimelineService.ts

import prisma from '../../lib/prisma.js';

export interface DealTimelineEvent {
  label: string;
  date: string | null;
  description: string;
  status: "completed" | "pending" | "not_started";
}

/**
 * Generates a structured, chronological timeline for a deal.
 *
 * This is used for:
 *  - AI negotiation analysis
 *  - Creator dashboards
 *  - Deal reporting
 *  - CRM deal detail views
 */
export async function generateDealTimeline(dealId: string): Promise<DealTimelineEvent[]> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      Brand: true,
      Talent: true,
    },
  });

  if (!deal) {
    throw new Error(`Deal not found: ${dealId}`);
  }

  const timeline: DealTimelineEvent[] = [
    {
      label: "Inbound Lead Received",
      date: deal.createdAt?.toISOString() ?? null,
      description: `Brand ${deal.brandName || (deal as any).Brand?.name || ""} first contacted the agency.`,
      status: "completed",
    },
    {
      label: "Proposal Sent",
      date: deal.proposalSentAt?.toISOString() ?? null,
      description: "Proposal and rates sent to brand.",
      status: deal.proposalSentAt ? "completed" : "pending",
    },
    {
      label: "Negotiation in Progress",
      date: deal.negotiationStartedAt?.toISOString() ?? null,
      description: "Talent manager entered negotiation phase.",
      status: deal.negotiationStartedAt ? "completed" : "pending",
    },
    {
      label: "Contract Received",
      date: deal.contractReceivedAt?.toISOString() ?? null,
      description: "Brand provided contract draft for review.",
      status: deal.contractReceivedAt ? "completed" : "pending",
    },
    {
      label: "Contract Signed",
      date: deal.contractSignedAt?.toISOString() ?? null,
      description: "Talent signed and approved the contract.",
      status: deal.contractSignedAt ? "completed" : "pending",
    },
    {
      label: "Deliverables Completed",
      date: deal.deliverablesCompletedAt?.toISOString() ?? null,
      description: "All content was delivered by the talent.",
      status: deal.deliverablesCompletedAt ? "completed" : "pending",
    },
    {
      label: "Campaign Live",
      date: deal.campaignLiveAt?.toISOString() ?? null,
      description: "Brand approved content and campaign is now live.",
      status: deal.campaignLiveAt ? "completed" : "pending",
    },
    {
      label: "Deal Closed",
      date: deal.closedAt?.toISOString() ?? null,
      description: "The deal was completed and marked as closed.",
      status: deal.closedAt ? "completed" : "pending",
    },
  ];

  return timeline;
}

/**
 * Lightweight helper for AI usage.
 * Produces a string summarising timeline points.
 */
export function buildTimelineSummary(events: DealTimelineEvent[]): string {
  return events
    .map(
      (e) =>
        `• **${e.label}** — ${
          e.date ? new Date(e.date).toLocaleDateString("en-GB") : "Not completed"
        } (${e.status})`
    )
    .join("\n");
}

export default {
  generateDealTimeline,
  buildTimelineSummary,
};
