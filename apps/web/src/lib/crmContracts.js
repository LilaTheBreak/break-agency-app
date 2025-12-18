const STORAGE_KEY = "break_admin_crm_contracts_v1";

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

function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function readCrmContracts() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = safeJsonParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function writeCrmContracts(contracts) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(contracts) ? contracts : []));
}

export function upsertCrmContract(nextContract) {
  const contracts = readCrmContracts();
  const exists = contracts.some((c) => c.id === nextContract.id);
  const updated = exists ? contracts.map((c) => (c.id === nextContract.id ? nextContract : c)) : [nextContract, ...contracts];
  writeCrmContracts(updated);
  return updated;
}

export function deleteCrmContract(contractId) {
  const contracts = readCrmContracts();
  const updated = contracts.filter((c) => c.id !== contractId);
  writeCrmContracts(updated);
  return updated;
}

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

