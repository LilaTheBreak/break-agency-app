const STORAGE_KEY = "break_admin_crm_deals_v1";

export const DEAL_TYPES = [
  "Brand partnership",
  "Affiliate",
  "Event appearance",
  "Content licensing",
  "Speaking",
  "Other"
];

export const DEAL_STATUSES = [
  "Prospect",
  "In discussion",
  "Contract sent",
  "Confirmed",
  "Delivered",
  "Invoiced",
  "Paid",
  "Lost"
];

export const DEAL_VALUE_BANDS = ["£", "££", "£££"];

export const DEAL_CONFIDENCE = ["Low", "Medium", "High"];

function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function readCrmDeals() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = safeJsonParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function writeCrmDeals(deals) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(deals) ? deals : []));
}

export function upsertCrmDeal(nextDeal) {
  const deals = readCrmDeals();
  const exists = deals.some((d) => d.id === nextDeal.id);
  const updated = exists ? deals.map((d) => (d.id === nextDeal.id ? nextDeal : d)) : [nextDeal, ...deals];
  writeCrmDeals(updated);
  return updated;
}

export function deleteCrmDeal(dealId) {
  const deals = readCrmDeals();
  const updated = deals.filter((d) => d.id !== dealId);
  writeCrmDeals(updated);
  return updated;
}

export function validateDeal(deal) {
  const errors = [];
  if (!deal?.dealName?.trim()) errors.push("Deal name is required.");
  if (!deal?.brandId) errors.push("Brand is required. A deal cannot exist without a brand.");
  return { ok: errors.length === 0, errors };
}

export function isWonStatus(status) {
  return status === "Paid" || status === "Invoiced" || status === "Delivered" || status === "Confirmed";
}

export function isLostStatus(status) {
  return status === "Lost";
}

