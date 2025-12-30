// Phase 1: Removed localStorage functions - all CRUD operations now use API via crmClient.js
// This file now only contains utility functions and constants

export const CAMPAIGN_TYPES = [
  "Influencer campaign",
  "Seeding / gifting",
  "Event / experience",
  "PR moment",
  "Affiliate push",
  "Content series",
  "Other"
];

export const CAMPAIGN_STATUSES = ["Draft", "Active", "Completed", "Paused"];

export function formatCampaignDateRange({ startDate, endDate }) {
  if (!startDate && !endDate) return "";
  const format = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };
  const start = startDate ? format(startDate) : "";
  const end = endDate ? format(endDate) : "";
  if (start && end) return `${start} → ${end}`;
  return start || end;
}

