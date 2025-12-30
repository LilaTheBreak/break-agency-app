// Phase 1: Removed localStorage functions - all CRUD operations now use API via crmClient.js
// This file now only contains utility functions and constants

export const CONTRACT_TYPES = [
  "Brand partnership",
  "Affiliate agreement",
  "Appearance / speaking",
  "Licensing",
  "NDA",
  "Other"
];

export const CONTRACT_STATUSES = ["Draft", "Sent", "Signed", "Active", "Completed", "Expired", "Cancelled"];

export const RENEWAL_TYPES = ["Fixed term", "Auto-renew", "One-off"];

export function validateContract(contract) {
  const errors = [];
  if (!contract?.contractName?.trim()) errors.push("Contract name is required.");
  if (!contract?.brandId) errors.push("Brand is required.");
  if (!contract?.dealId) errors.push("Deal is required for commercial contracts.");
  return { ok: errors.length === 0, errors };
}

export function formatContractEndDate(endDate) {
  if (!endDate) return "—";
  const date = new Date(endDate);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function computeExpiryRisk({ endDate, status }) {
  if (!endDate) return "Low";
  if (status === "Expired" || status === "Cancelled" || status === "Completed") return "Low";
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return "Low";
  const days = Math.ceil((end.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "High";
  if (days <= 30) return "High";
  if (days <= 60) return "Medium";
  return "Low";
}

export function isActiveContract(status) {
  return status === "Active" || status === "Signed" || status === "Sent" || status === "Draft";
}

