const STORAGE_KEY = "break_admin_crm_campaigns_v1";

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

function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function readCrmCampaigns() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = safeJsonParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function writeCrmCampaigns(campaigns) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(campaigns) ? campaigns : []));
}

export function upsertCrmCampaign(nextCampaign) {
  const campaigns = readCrmCampaigns();
  const exists = campaigns.some((c) => c.id === nextCampaign.id);
  const updated = exists
    ? campaigns.map((c) => (c.id === nextCampaign.id ? nextCampaign : c))
    : [nextCampaign, ...campaigns];
  writeCrmCampaigns(updated);
  return updated;
}

export function deleteCrmCampaign(campaignId) {
  const campaigns = readCrmCampaigns();
  const updated = campaigns.filter((c) => c.id !== campaignId);
  writeCrmCampaigns(updated);
  return updated;
}

export function linkDealToCampaign({ campaignId, dealId, dealLabel }) {
  const campaigns = readCrmCampaigns();
  const updated = campaigns.map((campaign) => {
    if (campaign.id !== campaignId) return campaign;
    const next = new Set([...(campaign.linkedDealIds || []), dealId].filter(Boolean));
    const activity = [
      { at: new Date().toISOString(), label: `Deal added${dealLabel ? `: ${dealLabel}` : ""}` },
      ...(campaign.activity || [])
    ];
    return {
      ...campaign,
      linkedDealIds: Array.from(next),
      activity,
      lastActivityAt: activity[0]?.at || campaign.lastActivityAt || campaign.updatedAt || campaign.createdAt
    };
  });
  writeCrmCampaigns(updated);
  return updated;
}

export function unlinkDealFromCampaign({ campaignId, dealId }) {
  const campaigns = readCrmCampaigns();
  const updated = campaigns.map((campaign) => {
    if (campaign.id !== campaignId) return campaign;
    return {
      ...campaign,
      linkedDealIds: (campaign.linkedDealIds || []).filter((id) => id !== dealId)
    };
  });
  writeCrmCampaigns(updated);
  return updated;
}

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

