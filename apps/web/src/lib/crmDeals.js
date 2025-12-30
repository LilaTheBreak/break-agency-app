// Phase 1: Removed localStorage functions - all CRUD operations now use API via crmClient.js
// This file now only contains utility functions and constants

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

