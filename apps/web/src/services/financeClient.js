/**
 * Phase 5: Finance API Client
 * All finance data comes from backend APIs - no localStorage
 */
import { apiFetch } from "./apiClient.js";

/**
 * GET /api/admin/finance/summary
 * Get finance summary (snapshot metrics)
 */
export async function fetchFinanceSummary(filters = {}) {
  const params = new URLSearchParams();
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.creatorId) params.append("creatorId", filters.creatorId);
  if (filters.brandId) params.append("brandId", filters.brandId);
  if (filters.dealId) params.append("dealId", filters.dealId);

  const response = await apiFetch(`/api/admin/finance/summary?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch finance summary: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * GET /api/admin/finance/cashflow
 * Get cash flow time-series data
 */
export async function fetchCashFlow(filters = {}) {
  const params = new URLSearchParams();
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.months) params.append("months", filters.months);

  const response = await apiFetch(`/api/admin/finance/cashflow?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch cash flow: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * GET /api/admin/finance/payouts
 * Get all payouts with optional filters
 */
export async function fetchPayouts(filters = {}) {
  const params = new URLSearchParams();
  if (filters.creatorId) params.append("creatorId", filters.creatorId);
  if (filters.dealId) params.append("dealId", filters.dealId);
  if (filters.brandId) params.append("brandId", filters.brandId);
  if (filters.status) params.append("status", filters.status);
  if (filters.limit) params.append("limit", filters.limit);

  const response = await apiFetch(`/api/admin/finance/payouts?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch payouts: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * GET /api/admin/finance/invoices
 * Get all invoices with optional filters
 */
export async function fetchInvoices(filters = {}) {
  const params = new URLSearchParams();
  if (filters.dealId) params.append("dealId", filters.dealId);
  if (filters.brandId) params.append("brandId", filters.brandId);
  if (filters.status) params.append("status", filters.status);
  if (filters.limit) params.append("limit", filters.limit);

  const response = await apiFetch(`/api/admin/finance/invoices?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch invoices: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * GET /api/admin/finance/by-creator
 * Get aggregated revenue per creator
 */
export async function fetchPayoutsByCreator(filters = {}) {
  const params = new URLSearchParams();
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);

  const response = await apiFetch(`/api/admin/finance/by-creator?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch payouts by creator: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * GET /api/admin/finance/attention
 * Get attention items (overdue invoices, delayed payouts)
 */
export async function fetchAttentionItems() {
  const response = await apiFetch("/api/admin/finance/attention");
  if (!response.ok) {
    throw new Error(`Failed to fetch attention items: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * GET /api/admin/finance/analytics
 * Get comprehensive finance analytics
 */
export async function fetchFinanceAnalytics(filters = {}) {
  const params = new URLSearchParams();
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.creatorId) params.append("creatorId", filters.creatorId);
  if (filters.brandId) params.append("brandId", filters.brandId);
  if (filters.dealId) params.append("dealId", filters.dealId);
  if (filters.status) params.append("status", filters.status);

  const response = await apiFetch(`/api/admin/finance/analytics?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch finance analytics: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * POST /api/admin/finance/invoices
 * Create a new invoice
 */
export async function createInvoice(data) {
  const response = await apiFetch("/api/admin/finance/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to create invoice" }));
    throw new Error(error.message || error.error || "Failed to create invoice");
  }
  return response.json();
}

/**
 * PATCH /api/admin/finance/invoices/:id
 * Update an invoice
 */
export async function updateInvoice(id, data) {
  const response = await apiFetch(`/api/admin/finance/invoices/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to update invoice" }));
    throw new Error(error.message || error.error || "Failed to update invoice");
  }
  return response.json();
}

/**
 * POST /api/admin/finance/invoices/:id/mark-paid
 * Mark an invoice as paid
 */
export async function markInvoicePaid(id, data = {}) {
  const response = await apiFetch(`/api/admin/finance/invoices/${id}/mark-paid`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to mark invoice as paid" }));
    throw new Error(error.message || error.error || "Failed to mark invoice as paid");
  }
  return response.json();
}

/**
 * POST /api/admin/finance/payouts
 * Create a new payout
 */
export async function createPayout(data) {
  const response = await apiFetch("/api/admin/finance/payouts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to create payout" }));
    throw new Error(error.message || error.error || "Failed to create payout");
  }
  return response.json();
}

/**
 * POST /api/admin/finance/payouts/:id/mark-paid
 * Mark a payout as paid
 */
export async function markPayoutPaid(id, data = {}) {
  const response = await apiFetch(`/api/admin/finance/payouts/${id}/mark-paid`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to mark payout as paid" }));
    throw new Error(error.message || error.error || "Failed to mark payout as paid");
  }
  return response.json();
}

/**
 * GET /api/admin/finance/commissions
 * Get all commissions with optional filters
 */
export async function fetchCommissions(filters = {}) {
  const params = new URLSearchParams();
  if (filters.dealId) params.append("dealId", filters.dealId);
  if (filters.talentId) params.append("talentId", filters.talentId);
  if (filters.agentId) params.append("agentId", filters.agentId);
  if (filters.status) params.append("status", filters.status);
  if (filters.limit) params.append("limit", filters.limit);

  const response = await apiFetch(`/api/admin/finance/commissions?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch commissions: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * GET /api/admin/finance/commissions/:id
 * Get a single commission by ID
 */
export async function fetchCommission(id) {
  const response = await apiFetch(`/api/admin/finance/commissions/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch commission: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
