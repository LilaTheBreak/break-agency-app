import { apiFetch } from "./apiClient.js";

/**
 * Finance API Client
 */

// Summary & Metrics
export async function fetchFinanceSummary(filters = {}) {
  const params = new URLSearchParams();
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.creatorId) params.append("creatorId", filters.creatorId);
  if (filters.brandId) params.append("brandId", filters.brandId);
  if (filters.dealId) params.append("dealId", filters.dealId);
  if (filters.status) params.append("status", filters.status);
  
  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await apiFetch(`/api/admin/finance/summary${query}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch summary" }));
    throw new Error(error.error || "Failed to fetch finance summary");
  }
  
  return response.json();
}

// Payouts
export async function fetchPayouts(filters = {}) {
  const params = new URLSearchParams();
  if (filters.creatorId) params.append("creatorId", filters.creatorId);
  if (filters.dealId) params.append("dealId", filters.dealId);
  if (filters.status) params.append("status", filters.status);
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  
  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await apiFetch(`/api/admin/finance/payouts${query}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch payouts" }));
    throw new Error(error.error || "Failed to fetch payouts");
  }
  
  return response.json();
}

export async function fetchPayoutById(id) {
  const response = await apiFetch(`/api/admin/finance/payouts/${id}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch payout" }));
    throw new Error(error.error || "Failed to fetch payout");
  }
  
  return response.json();
}

export async function createPayout(payoutData) {
  const response = await apiFetch("/api/admin/finance/payouts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payoutData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to create payout" }));
    throw new Error(error.error || "Failed to create payout");
  }
  
  return response.json();
}

export async function updatePayout(id, payoutData) {
  const response = await apiFetch(`/api/admin/finance/payouts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payoutData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to update payout" }));
    throw new Error(error.error || "Failed to update payout");
  }
  
  return response.json();
}

export async function approvePayout(id) {
  const response = await apiFetch(`/api/admin/finance/payouts/${id}/approve`, {
    method: "POST",
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to approve payout" }));
    throw new Error(error.error || "Failed to approve payout");
  }
  
  return response.json();
}

export async function schedulePayout(id, scheduleDate) {
  const response = await apiFetch(`/api/admin/finance/payouts/${id}/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scheduleDate }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to schedule payout" }));
    throw new Error(error.error || "Failed to schedule payout");
  }
  
  return response.json();
}

export async function markPayoutPaid(id, paymentData = {}) {
  const response = await apiFetch(`/api/admin/finance/payouts/${id}/mark-paid`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to mark payout as paid" }));
    throw new Error(error.error || "Failed to mark payout as paid");
  }
  
  return response.json();
}

// Invoices
export async function fetchInvoices(filters = {}) {
  const params = new URLSearchParams();
  if (filters.brandId) params.append("brandId", filters.brandId);
  if (filters.dealId) params.append("dealId", filters.dealId);
  if (filters.status) params.append("status", filters.status);
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  
  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await apiFetch(`/api/admin/finance/invoices${query}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch invoices" }));
    throw new Error(error.error || "Failed to fetch invoices");
  }
  
  return response.json();
}

export async function fetchInvoiceById(id) {
  const response = await apiFetch(`/api/admin/finance/invoices/${id}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch invoice" }));
    throw new Error(error.error || "Failed to fetch invoice");
  }
  
  return response.json();
}

export async function createInvoice(invoiceData) {
  const response = await apiFetch("/api/admin/finance/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invoiceData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to create invoice" }));
    throw new Error(error.error || "Failed to create invoice");
  }
  
  return response.json();
}

export async function updateInvoice(id, invoiceData) {
  const response = await apiFetch(`/api/admin/finance/invoices/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invoiceData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to update invoice" }));
    throw new Error(error.error || "Failed to update invoice");
  }
  
  return response.json();
}

export async function markInvoicePaid(id, paymentData = {}) {
  const response = await apiFetch(`/api/admin/finance/invoices/${id}/mark-paid`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to mark invoice as paid" }));
    throw new Error(error.error || "Failed to mark invoice as paid");
  }
  
  return response.json();
}

// Documents
export async function fetchFinanceDocuments(filters = {}) {
  const params = new URLSearchParams();
  if (filters.linkedType) params.append("linkedType", filters.linkedType);
  if (filters.linkedId) params.append("linkedId", filters.linkedId);
  
  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await apiFetch(`/api/admin/finance/documents${query}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch documents" }));
    throw new Error(error.error || "Failed to fetch finance documents");
  }
  
  return response.json();
}

export async function uploadFinanceDocument(documentData) {
  const response = await apiFetch("/api/admin/finance/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(documentData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to upload document" }));
    throw new Error(error.error || "Failed to upload document");
  }
  
  return response.json();
}

export async function deleteFinanceDocument(id) {
  const response = await apiFetch(`/api/admin/finance/documents/${id}`, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to delete document" }));
    throw new Error(error.error || "Failed to delete document");
  }
  
  return response.json();
}

// Activity Timeline
export async function fetchFinanceActivity(filters = {}) {
  const params = new URLSearchParams();
  if (filters.dealId) params.append("dealId", filters.dealId);
  if (filters.brandId) params.append("brandId", filters.brandId);
  if (filters.creatorId) params.append("creatorId", filters.creatorId);
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.limit) params.append("limit", filters.limit);
  
  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await apiFetch(`/api/admin/finance/activity${query}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch activity" }));
    throw new Error(error.error || "Failed to fetch finance activity");
  }
  
  return response.json();
}

// Reconciliation
export async function fetchReconciliations(filters = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.append("type", filters.type);
  if (filters.confirmed !== undefined) params.append("confirmed", filters.confirmed);
  
  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await apiFetch(`/api/admin/finance/reconciliations${query}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch reconciliations" }));
    throw new Error(error.error || "Failed to fetch reconciliations");
  }
  
  return response.json();
}

export async function createReconciliation(reconciliationData) {
  const response = await apiFetch("/api/admin/finance/reconciliations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reconciliationData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to create reconciliation" }));
    throw new Error(error.error || "Failed to create reconciliation");
  }
  
  return response.json();
}

// Xero Integration
// REMOVED: Xero integration not implemented - endpoints return 410
export async function fetchXeroStatus() {
  throw new Error("Xero integration is not yet available. This feature has been removed.");
}

export async function connectXero(connectionData) {
  throw new Error("Xero integration is not yet available. This feature has been removed.");
}

export async function syncXero() {
  throw new Error("Xero integration is not yet available. This feature has been removed.");
}
