import { apiFetch } from "./apiClient.js";

async function fetchWithAuth(url, options = {}) {
  try {
    // Use apiFetch which includes Bearer token for cross-domain auth
    const fullUrl = url.startsWith('http') ? url : url;
    const response = await apiFetch(fullUrl, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      console.warn(`[CRM] ${options.method || 'GET'} ${url} failed:`, response.status);
      throw new Error(error.error || "Request failed");
    }

    return response.json();
  } catch (error) {
    // Log error but don't crash - let caller handle gracefully
    console.warn(`[CRM] Request failed for ${url}:`, error.message);
    throw error;
  }
}

// ============================================
// BRANDS
// ============================================

export async function fetchBrands() {
  return fetchWithAuth(`/api/crm-brands`);
}

export async function fetchBrand(id) {
  return fetchWithAuth(`/api/crm-brands/${id}`);
}

export async function createBrand(data) {
  return fetchWithAuth(`/api/crm-brands`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateBrand(id, data) {
  return fetchWithAuth(`/api/crm-brands/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteBrand(id) {
  return fetchWithAuth(`/api/crm-brands/${id}`, {
    method: "DELETE",
  });
}

export async function importLocalStorageData({ brands, contacts, outreach }) {
  return fetchWithAuth(`/api/crm-brands/batch-import`, {
    method: "POST",
    body: JSON.stringify({ brands, contacts, outreach }),
  });
}

// ============================================
// CONTACTS
// ============================================

export async function fetchContacts(brandId = null) {
  const url = brandId
    ? `/api/crm-contacts?brandId=${brandId}`
    : `/api/crm-contacts`;
  return fetchWithAuth(url);
}

export async function fetchContact(id) {
  return fetchWithAuth(`/api/crm-contacts/${id}`);
}

export async function createContact(data) {
  return fetchWithAuth(`/api/crm-contacts`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateContact(id, data) {
  return fetchWithAuth(`/api/crm-contacts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteContact(id) {
  return fetchWithAuth(`/api/crm-contacts/${id}`, {
    method: "DELETE",
  });
}

export async function addContactNote(id, text, author) {
  return fetchWithAuth(`/api/crm-contacts/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ text, author }),
  });
}

// ============================================
// OUTREACH RECORDS
// ============================================

export async function fetchOutreachRecords(filters = {}) {
  const params = new URLSearchParams();
  if (filters.brandId) params.set("brandId", filters.brandId);
  if (filters.contactId) params.set("contactId", filters.contactId);
  if (filters.dealId) params.set("dealId", filters.dealId);
  if (filters.outcome) params.set("outcome", filters.outcome);
  if (filters.channel) params.set("channel", filters.channel);
  if (filters.limit) params.set("limit", filters.limit);

  const url = `/api/outreach-records${params.toString() ? `?${params}` : ""}`;
  return fetchWithAuth(url);
}

export async function fetchOutreachRecord(id) {
  return fetchWithAuth(`/api/outreach-records/${id}`);
}

export async function createOutreachRecord(data) {
  return fetchWithAuth(`/api/outreach-records`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateOutreachRecord(id, data) {
  return fetchWithAuth(`/api/outreach-records/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteOutreachRecord(id) {
  return fetchWithAuth(`/api/outreach-records/${id}`, {
    method: "DELETE",
  });
}

export async function fetchOutreachStats(brandId = null) {
  const url = brandId
    ? `/api/outreach-records/summary/stats?brandId=${brandId}`
    : `/api/outreach-records/summary/stats`;
  return fetchWithAuth(url);
}

// ============================================
// CAMPAIGNS
// ============================================

export async function fetchCampaigns(filters = {}) {
  const params = new URLSearchParams();
  if (filters.brandId) params.set("brandId", filters.brandId);
  if (filters.status) params.set("status", filters.status);
  if (filters.owner) params.set("owner", filters.owner);
  if (filters.talentId) params.set("talentId", filters.talentId); // Filter campaigns by linked talent

  const url = `/api/crm-campaigns${params.toString() ? `?${params}` : ""}`;
  return fetchWithAuth(url);
}

export async function fetchCampaign(id) {
  return fetchWithAuth(`/api/crm-campaigns/${id}`);
}

export async function createCampaign(data) {
  return fetchWithAuth(`/api/crm-campaigns`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCampaign(id, data) {
  return fetchWithAuth(`/api/crm-campaigns/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteCampaign(id) {
  return fetchWithAuth(`/api/crm-campaigns/${id}`, {
    method: "DELETE",
  });
}

export async function linkDealToCampaign(campaignId, dealId, dealLabel = null) {
  return fetchWithAuth(`/api/crm-campaigns/${campaignId}/link-deal`, {
    method: "POST",
    body: JSON.stringify({ dealId, dealLabel }),
  });
}

export async function unlinkDealFromCampaign(campaignId, dealId) {
  return fetchWithAuth(`/api/crm-campaigns/${campaignId}/unlink-deal/${dealId}`, {
    method: "DELETE",
  });
}

export async function importCampaignsFromLocalStorage(campaigns) {
  return fetchWithAuth(`/api/crm-campaigns/batch-import`, {
    method: "POST",
    body: JSON.stringify({ campaigns }),
  });
}

// ============================================
// EVENTS
// ============================================

export async function fetchEvents(filters = {}) {
  const params = new URLSearchParams();
  if (filters.brandId) params.append("brandId", filters.brandId);
  if (filters.status) params.append("status", filters.status);
  if (filters.owner) params.append("owner", filters.owner);

  const url = params.toString() 
    ? `/api/crm-events?${params.toString()}`
    : `/api/crm-events`;
  
  return fetchWithAuth(url);
}

export async function fetchEvent(id) {
  return fetchWithAuth(`/api/crm-events/${id}`);
}

export async function createEvent(data) {
  return fetchWithAuth(`/api/crm-events`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateEvent(id, data) {
  return fetchWithAuth(`/api/crm-events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteEvent(id) {
  return fetchWithAuth(`/api/crm-events/${id}`, {
    method: "DELETE",
  });
}

export async function addEventNote(id, text, author) {
  return fetchWithAuth(`/api/crm-events/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ text, author }),
  });
}

export async function importEventsFromLocalStorage(events) {
  return fetchWithAuth(`/api/crm-events/batch-import`, {
    method: "POST",
    body: JSON.stringify({ events }),
  });
}

// ------------------------------------------------------
// DEALS
// ------------------------------------------------------

export async function fetchDeals(filters = {}) {
  const params = new URLSearchParams();
  if (filters.brandId) params.set("brandId", filters.brandId);
  if (filters.status) params.set("status", filters.status);
  if (filters.owner) params.set("owner", filters.owner);
  
  const url = params.toString()
    ? `/api/crm-deals?${params.toString()}`
    : `/api/crm-deals`;
  
  return fetchWithAuth(url);
}

export async function fetchDeal(id) {
  return fetchWithAuth(`/api/crm-deals/${id}`);
}

export async function createDeal(data) {
  return fetchWithAuth(`/api/crm-deals`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDeal(id, data) {
  return fetchWithAuth(`/api/crm-deals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteDeal(id) {
  return fetchWithAuth(`/api/crm-deals/${id}`, {
    method: "DELETE",
  });
}

export async function addDealNote(id, text, author) {
  return fetchWithAuth(`/api/crm-deals/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ text, author }),
  });
}

export async function importDealsFromLocalStorage(deals) {
  return fetchWithAuth(`/api/crm-deals/batch-import`, {
    method: "POST",
    body: JSON.stringify({ deals }),
  });
}

// ------------------------------------------------------
// CRM Contracts
// ------------------------------------------------------

export async function fetchContracts(filters = {}) {
  const params = new URLSearchParams();
  if (filters.brandId) params.set("brandId", filters.brandId);
  if (filters.dealId) params.set("dealId", filters.dealId);
  if (filters.status) params.set("status", filters.status);
  if (filters.owner) params.set("owner", filters.owner);
  
  const url = params.toString()
    ? `/api/crm-contracts?${params.toString()}`
    : `/api/crm-contracts`;
  
  return fetchWithAuth(url);
}

export async function fetchContract(id) {
  return fetchWithAuth(`/api/crm-contracts/${id}`);
}

export async function createContract(data) {
  return fetchWithAuth(`/api/crm-contracts`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateContract(id, data) {
  return fetchWithAuth(`/api/crm-contracts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteContract(id) {
  return fetchWithAuth(`/api/crm-contracts/${id}`, {
    method: "DELETE",
  });
}

export async function addContractNote(id, note) {
  return fetchWithAuth(`/api/crm-contracts/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export async function importContractsFromLocalStorage(contracts) {
  return fetchWithAuth(`/api/crm-contracts/batch-import`, {
    method: "POST",
    body: JSON.stringify({ contracts }),
  });
}

